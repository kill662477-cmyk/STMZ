#!/usr/bin/env python3
"""Process AI-generated key-pose boards into reviewable sprite frames.

The generator is expected to place one pose in each cell on a green chroma
background. This tool removes the background, slices the board, reports unsafe
cell-edge contact, and writes a checkerboard preview. It never promotes assets
into ``assets/game``.
"""

from __future__ import annotations

import argparse
import json
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage


DEFAULT_NAMES = ("idle_low", "idle_high", "windup", "release", "recovery", "hit")


def parse_names(value: str, count: int) -> list[str]:
    names = [part.strip() for part in value.split(",") if part.strip()]
    if len(names) != count:
        raise ValueError(f"Expected {count} comma-separated frame names, got {len(names)}")
    return names


def sample_key_color(rgb: np.ndarray) -> np.ndarray:
    height, width, _ = rgb.shape
    band = max(2, min(height, width) // 64)
    border = np.concatenate(
        (
            rgb[:band].reshape(-1, 3),
            rgb[-band:].reshape(-1, 3),
            rgb[:, :band].reshape(-1, 3),
            rgb[:, -band:].reshape(-1, 3),
        ),
        axis=0,
    )
    green_candidates = border[
        (border[:, 1] > border[:, 0] * 1.35)
        & (border[:, 1] > border[:, 2] * 1.35)
        & (border[:, 1] > 90)
    ]
    if green_candidates.size == 0:
        green_candidates = border
    return np.median(green_candidates, axis=0).astype(np.float32)


def remove_chroma(
    image: Image.Image,
    *,
    transparent_threshold: float,
    opaque_threshold: float,
    alpha_cutoff: int,
    alpha_median_size: int,
    border_component_ratio: float,
    foreground_seed_threshold: int,
    foreground_min_area: int,
    foreground_grow: int,
) -> tuple[Image.Image, tuple[int, int, int]]:
    rgba = np.asarray(image.convert("RGBA"), dtype=np.uint8).copy()
    rgb = rgba[:, :, :3].astype(np.float32)
    key = sample_key_color(rgb)
    distance = np.linalg.norm(rgb - key[None, None, :], axis=2)
    distance_matte = np.clip(
        (distance - transparent_threshold) / (opaque_threshold - transparent_threshold),
        0.0,
        1.0,
    )
    red = rgba[:, :, 0].astype(np.float32)
    green = rgba[:, :, 1].astype(np.float32)
    blue = rgba[:, :, 2].astype(np.float32)
    green_excess = green - np.maximum(red, blue)
    # Generated chroma boards often contain a green vignette instead of one
    # exact RGB value. Green dominance removes that variation while leaving
    # cyan energy and golden armor opaque.
    green_matte = np.clip((90.0 - green_excess) / 65.0, 0.0, 1.0)
    matte = np.minimum(distance_matte, green_matte)
    alpha = rgba[:, :, 3].astype(np.float32) * matte

    # Remove green spill only around partially transparent antialiased edges.
    edge = (alpha > 0) & (alpha < 250)
    neutral_green = np.maximum(red, blue)
    green[edge] = neutral_green[edge] + (green[edge] - neutral_green[edge]) * (alpha[edge] / 255.0)
    rgba[:, :, 1] = np.clip(green, 0, 255).astype(np.uint8)
    rgba[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)
    if alpha_cutoff > 0:
        rgba[:, :, 3][rgba[:, :, 3] <= alpha_cutoff] = 0
    if alpha_median_size > 1:
        if alpha_median_size % 2 == 0:
            raise ValueError("--alpha-median-size must be an odd integer")
        rgba[:, :, 3] = np.asarray(
            Image.fromarray(rgba[:, :, 3]).filter(ImageFilter.MedianFilter(alpha_median_size)),
            dtype=np.uint8,
        )
    if foreground_seed_threshold > 0 and foreground_min_area > 0:
        restrict_to_foreground_seeds(
            rgba[:, :, 3],
            seed_threshold=foreground_seed_threshold,
            min_area=foreground_min_area,
            grow=foreground_grow,
        )
    if border_component_ratio > 0:
        clear_small_border_components(
            rgba[:, :, 3],
            max_area=max(1, int(rgba.shape[0] * rgba.shape[1] * border_component_ratio)),
        )
    return Image.fromarray(rgba), tuple(int(round(channel)) for channel in key)


def border_connected_mask(mask: np.ndarray) -> np.ndarray:
    """Return mask pixels connected to any image edge using 4-way adjacency."""

    height, width = mask.shape
    connected = np.zeros(mask.shape, dtype=bool)
    queue: deque[tuple[int, int]] = deque()
    for x in range(width):
        if mask[0, x]:
            connected[0, x] = True
            queue.append((0, x))
        if mask[height - 1, x] and not connected[height - 1, x]:
            connected[height - 1, x] = True
            queue.append((height - 1, x))
    for y in range(1, height - 1):
        if mask[y, 0]:
            connected[y, 0] = True
            queue.append((y, 0))
        if mask[y, width - 1] and not connected[y, width - 1]:
            connected[y, width - 1] = True
            queue.append((y, width - 1))
    while queue:
        y, x = queue.popleft()
        for next_y, next_x in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if (
                0 <= next_y < height
                and 0 <= next_x < width
                and mask[next_y, next_x]
                and not connected[next_y, next_x]
            ):
                connected[next_y, next_x] = True
                queue.append((next_y, next_x))
    return connected


def remove_baked_checkerboard(image: Image.Image) -> Image.Image:
    """Turn a light neutral checkerboard baked into RGB into real alpha.

    Border-connected background is removed first. Enclosed checker patches
    trapped between legs, arms, or weapons are identified by their alternating
    luminance pattern; compact uniform highlights and muzzle-flash cores remain.
    """

    rgba = np.asarray(image.convert("RGBA"), dtype=np.uint8).copy()
    rgb = rgba[:, :, :3].astype(np.float32)
    maximum = rgb.max(axis=2)
    minimum = rgb.min(axis=2)
    chroma = maximum - minimum
    luminance = (
        rgb[:, :, 0] * 0.2126
        + rgb[:, :, 1] * 0.7152
        + rgb[:, :, 2] * 0.0722
    )
    neutral_light = (luminance >= 178.0) & (chroma <= 32.0)
    connected = border_connected_mask(neutral_light)
    enclosed = neutral_light & ~connected
    enclosed_checker = np.zeros(enclosed.shape, dtype=bool)
    labels, _ = ndimage.label(
        enclosed,
        structure=np.ones((3, 3), dtype=np.uint8),
    )
    for label, bounds in enumerate(ndimage.find_objects(labels), 1):
        if bounds is None:
            continue
        local = labels[bounds] == label
        area = int(local.sum())
        height = bounds[0].stop - bounds[0].start
        width = bounds[1].stop - bounds[1].start
        if area < 40 or width < 8 or height < 8:
            continue
        values = luminance[bounds][local]
        # Checker holes contain both the light and shaded tile colors. Genuine
        # white details are small or nearly uniform and therefore stay opaque.
        if float(values.std()) < 7.0 or float(np.ptp(values)) < 18.0:
            continue
        local_output = enclosed_checker[bounds]
        local_output[local] = True

    alpha = rgba[:, :, 3].astype(np.float32)
    background = connected | enclosed_checker
    fully_clear = background & (luminance >= 220.0)
    soft_edge = background & (luminance >= 185.0) & ~fully_clear
    alpha[fully_clear] = 0.0
    alpha[soft_edge] *= np.clip((220.0 - luminance[soft_edge]) / 35.0, 0.0, 1.0)
    rgba[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)
    rgba[rgba[:, :, 3] == 0, :3] = 0
    return Image.fromarray(rgba)


def strip_detached_neutral_labels(frame: Image.Image) -> tuple[Image.Image, int]:
    """Remove dark frame-number labels detached above or below the main pose."""

    rgba = np.asarray(frame.convert("RGBA"), dtype=np.uint8).copy()
    visible = rgba[:, :, 3] > 24
    height, width = visible.shape
    visited = np.zeros(visible.shape, dtype=bool)
    components: list[list[tuple[int, int]]] = []
    for start_y, start_x in np.argwhere(visible):
        if visited[start_y, start_x]:
            continue
        queue = deque([(int(start_y), int(start_x))])
        visited[start_y, start_x] = True
        component: list[tuple[int, int]] = []
        while queue:
            y, x = queue.popleft()
            component.append((y, x))
            for next_y in range(max(0, y - 1), min(height, y + 2)):
                for next_x in range(max(0, x - 1), min(width, x + 2)):
                    if visible[next_y, next_x] and not visited[next_y, next_x]:
                        visited[next_y, next_x] = True
                        queue.append((next_y, next_x))
        components.append(component)

    if not components:
        return frame, 0
    main = max(components, key=len)
    main_ys = np.asarray([point[0] for point in main])
    main_top = int(main_ys.min())
    main_bottom = int(main_ys.max())
    removed = 0
    for component in components:
        if component is main or len(component) > 1200:
            continue
        ys = np.asarray([point[0] for point in component])
        xs = np.asarray([point[1] for point in component])
        top = int(ys.min())
        bottom = int(ys.max())
        if not (bottom < main_top - 2 or top > main_bottom + 2):
            continue
        pixels = rgba[ys, xs, :3].astype(np.float32)
        component_chroma = float(np.mean(pixels.max(axis=1) - pixels.min(axis=1)))
        component_luminance = float(
            np.mean(
                pixels[:, 0] * 0.2126
                + pixels[:, 1] * 0.7152
                + pixels[:, 2] * 0.0722
            )
        )
        if component_chroma <= 18.0 and component_luminance <= 190.0:
            rgba[ys, xs, 3] = 0
            removed += 1
    return Image.fromarray(rgba), removed


def clear_small_border_components(alpha: np.ndarray, *, max_area: int) -> None:
    """Clear small opaque artifacts connected to the image border.

    AI chroma outputs sometimes leave a dark corner fleck or vignette remnant.
    Large border-connected components are preserved so genuinely cropped
    subjects still fail QA instead of being silently erased.
    """

    height, width = alpha.shape
    visible = alpha > 0
    visited = np.zeros((height, width), dtype=bool)
    starts = (
        [(0, x) for x in range(width)]
        + [(height - 1, x) for x in range(width)]
        + [(y, 0) for y in range(1, height - 1)]
        + [(y, width - 1) for y in range(1, height - 1)]
    )
    for start_y, start_x in starts:
        if not visible[start_y, start_x] or visited[start_y, start_x]:
            continue
        queue = deque([(start_y, start_x)])
        visited[start_y, start_x] = True
        component: list[tuple[int, int]] = []
        while queue:
            y, x = queue.popleft()
            component.append((y, x))
            for next_y, next_x in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if (
                    0 <= next_y < height
                    and 0 <= next_x < width
                    and visible[next_y, next_x]
                    and not visited[next_y, next_x]
                ):
                    visited[next_y, next_x] = True
                    queue.append((next_y, next_x))
        if len(component) <= max_area:
            ys, xs = zip(*component)
            alpha[np.asarray(ys), np.asarray(xs)] = 0


def restrict_to_foreground_seeds(
    alpha: np.ndarray,
    *,
    seed_threshold: int,
    min_area: int,
    grow: int,
) -> None:
    """Keep soft alpha only near substantial high-confidence foreground regions."""

    seeds = alpha >= seed_threshold
    visited = np.zeros(alpha.shape, dtype=bool)
    kept = np.zeros(alpha.shape, dtype=np.uint8)
    height, width = alpha.shape
    for start_y, start_x in np.argwhere(seeds):
        if visited[start_y, start_x]:
            continue
        queue = deque([(int(start_y), int(start_x))])
        visited[start_y, start_x] = True
        component: list[tuple[int, int]] = []
        while queue:
            y, x = queue.popleft()
            component.append((y, x))
            for next_y in range(max(0, y - 1), min(height, y + 2)):
                for next_x in range(max(0, x - 1), min(width, x + 2)):
                    if seeds[next_y, next_x] and not visited[next_y, next_x]:
                        visited[next_y, next_x] = True
                        queue.append((next_y, next_x))
        if len(component) >= min_area:
            ys, xs = zip(*component)
            kept[np.asarray(ys), np.asarray(xs)] = 255
    if grow > 0:
        kept = np.asarray(
            Image.fromarray(kept).filter(ImageFilter.MaxFilter(grow * 2 + 1)),
            dtype=np.uint8,
        )
    alpha[kept == 0] = 0


def frame_bounds(alpha: np.ndarray, threshold: int = 8) -> tuple[int, int, int, int] | None:
    ys, xs = np.nonzero(alpha > threshold)
    if len(xs) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def analyze_frame(frame: Image.Image, *, safe_margin: int) -> dict[str, object]:
    alpha = np.asarray(frame.getchannel("A"), dtype=np.uint8)
    height, width = alpha.shape
    bounds = frame_bounds(alpha)
    if bounds is None:
        return {
            "status": "fail",
            "reason": "empty frame",
            "width": width,
            "height": height,
            "edge_pixels": 0,
        }

    left, top, right, bottom = bounds
    margins = {
        "left": left,
        "right": width - right,
        "top": top,
        "bottom": height - bottom,
    }
    edge_pixels = int(
        np.count_nonzero(alpha[0])
        + np.count_nonzero(alpha[-1])
        + np.count_nonzero(alpha[:, 0])
        + np.count_nonzero(alpha[:, -1])
    )
    visible = int(np.count_nonzero(alpha > 8))
    partial = int(np.count_nonzero((alpha > 0) & (alpha < 255)))
    unsafe = [name for name, value in margins.items() if value < safe_margin]
    return {
        "status": "pass" if edge_pixels == 0 and not unsafe else "fail",
        "width": width,
        "height": height,
        "bounds": [left, top, right, bottom],
        "margins": margins,
        "unsafe_margins": unsafe,
        "edge_pixels": edge_pixels,
        "visible_coverage": round(visible / (width * height), 5),
        "partial_alpha_pixels": partial,
    }


def checkerboard(size: tuple[int, int], cell: int = 16) -> Image.Image:
    width, height = size
    canvas = Image.new("RGBA", size, (42, 45, 52, 255))
    draw = ImageDraw.Draw(canvas)
    light = (67, 71, 80, 255)
    for y in range(0, height, cell):
        for x in range(0, width, cell):
            if (x // cell + y // cell) % 2 == 0:
                draw.rectangle((x, y, min(x + cell, width), min(y + cell, height)), fill=light)
    return canvas


def normalize_frame(
    frame: Image.Image,
    *,
    width: int,
    height: int,
    content_width: int,
    content_height: int,
    bottom_margin: int,
) -> Image.Image:
    alpha = np.asarray(frame.getchannel("A"), dtype=np.uint8)
    bounds = frame_bounds(alpha)
    if bounds is None:
        return Image.new("RGBA", (width, height))
    crop = frame.crop(bounds)
    scale = min(content_width / crop.width, content_height / crop.height)
    resized_width = max(1, int(round(crop.width * scale)))
    resized_height = max(1, int(round(crop.height * scale)))
    crop = crop.resize((resized_width, resized_height), Image.Resampling.LANCZOS)
    x = (width - resized_width) // 2
    y = height - bottom_margin - resized_height
    if x < 0 or y < 0:
        raise ValueError(
            f"Normalized content {resized_width}x{resized_height} does not fit "
            f"{width}x{height} with bottom margin {bottom_margin}"
        )
    canvas = Image.new("RGBA", (width, height))
    canvas.alpha_composite(crop, (x, y))
    return canvas


def process(args: argparse.Namespace) -> int:
    source_path = Path(args.input)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    frames_dir = output_dir / "frames"
    frames_dir.mkdir(parents=True, exist_ok=True)

    source = Image.open(source_path).convert("RGBA")
    count = args.cols * args.rows
    names = parse_names(args.names, count)
    if args.alpha_input:
        alpha_board = source
        key_color = None
        background_mode = "alpha"
    elif args.checkerboard_input:
        alpha_board = remove_baked_checkerboard(source)
        key_color = None
        background_mode = "baked-checkerboard"
    else:
        alpha_board, key_color = remove_chroma(
            source,
            transparent_threshold=args.transparent_threshold,
            opaque_threshold=args.opaque_threshold,
            alpha_cutoff=args.alpha_cutoff,
            alpha_median_size=args.alpha_median_size,
            border_component_ratio=args.border_component_ratio,
            foreground_seed_threshold=args.foreground_seed_threshold,
            foreground_min_area=args.foreground_min_area,
            foreground_grow=args.foreground_grow,
        )
        background_mode = "chroma"

    width, height = alpha_board.size
    if width % args.cols != 0 or height % args.rows != 0:
        if not args.fit_grid:
            raise ValueError(
                f"Board size {width}x{height} is not divisible by grid {args.cols}x{args.rows}"
            )
        fitted_width = ((width + args.cols - 1) // args.cols) * args.cols
        fitted_height = ((height + args.rows - 1) // args.rows) * args.rows
        alpha_board = alpha_board.resize(
            (fitted_width, fitted_height),
            Image.Resampling.LANCZOS,
        )
        width, height = alpha_board.size
    frame_width = width // args.cols
    frame_height = height // args.rows
    normalized = args.normalize_width > 0 or args.normalize_height > 0
    if normalized and (args.normalize_width <= 0 or args.normalize_height <= 0):
        raise ValueError("--normalize-width and --normalize-height must be provided together")
    output_frame_width = args.normalize_width if normalized else frame_width
    output_frame_height = args.normalize_height if normalized else frame_height
    content_width = args.content_width or max(1, output_frame_width - args.safe_margin * 2)
    content_height = args.content_height or max(1, output_frame_height - args.safe_margin * 2)

    output_size = (output_frame_width * args.cols, output_frame_height * args.rows)
    output_sheet = Image.new("RGBA", output_size)
    preview = checkerboard(output_size)
    report_frames: list[dict[str, object]] = []
    flip_names = {part.strip() for part in args.flip_names.split(",") if part.strip()}
    for index, name in enumerate(names):
        col = index % args.cols
        row = index // args.cols
        box = (
            col * frame_width,
            row * frame_height,
            (col + 1) * frame_width,
            (row + 1) * frame_height,
        )
        frame = alpha_board.crop(box)
        stripped_labels = 0
        if args.strip_detached_labels:
            frame, stripped_labels = strip_detached_neutral_labels(frame)
        if name in flip_names:
            frame = frame.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        if normalized:
            frame = normalize_frame(
                frame,
                width=output_frame_width,
                height=output_frame_height,
                content_width=content_width,
                content_height=content_height,
                bottom_margin=args.bottom_margin,
            )
        frame_path = frames_dir / f"{index:02d}_{name}.png"
        frame.save(frame_path)
        output_x = col * output_frame_width
        output_y = row * output_frame_height
        output_sheet.alpha_composite(frame, (output_x, output_y))
        preview.alpha_composite(frame, (output_x, output_y))
        analysis = analyze_frame(frame, safe_margin=args.safe_margin)
        analysis.update(
            {
                "index": index,
                "name": name,
                "file": str(frame_path),
                "flipped_horizontally": name in flip_names,
                "stripped_detached_labels": stripped_labels,
            }
        )
        report_frames.append(analysis)

    sheet_path = output_dir / f"{args.name}_sheet.png"
    output_sheet.save(sheet_path)
    preview_path = output_dir / f"{args.name}_preview.png"
    preview.save(preview_path)

    passed = all(frame["status"] == "pass" for frame in report_frames)
    report = {
        "source": str(source_path),
        "sheet": str(sheet_path),
        "preview": str(preview_path),
        "grid": {"cols": args.cols, "rows": args.rows, "count": count},
        "source_frame_size": {"width": frame_width, "height": frame_height},
        "frame_size": {"width": output_frame_width, "height": output_frame_height},
        "background_mode": background_mode,
        "normalization": {
            "enabled": normalized,
            "content_width": content_width if normalized else None,
            "content_height": content_height if normalized else None,
            "bottom_margin": args.bottom_margin if normalized else None,
        },
        "key_color": list(key_color) if key_color is not None else None,
        "safe_margin": args.safe_margin,
        "status": "pass" if passed else "fail",
        "frames": report_frames,
    }
    report_path = output_dir / "qa-report.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if passed else 2


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, help="Source sprite board PNG")
    parser.add_argument("--output-dir", required=True, help="Review output directory")
    parser.add_argument("--name", required=True, help="Stable asset prefix")
    parser.add_argument("--cols", type=int, required=True)
    parser.add_argument("--rows", type=int, required=True)
    parser.add_argument(
        "--fit-grid",
        action="store_true",
        help="Resize minimally when the source dimensions are not divisible by the grid",
    )
    parser.add_argument(
        "--names",
        default=",".join(DEFAULT_NAMES),
        help="Comma-separated frame names in row-major order",
    )
    parser.add_argument(
        "--flip-names",
        default="",
        help="Comma-separated frame names to flip horizontally after slicing",
    )
    parser.add_argument("--alpha-input", action="store_true", help="Input already has final alpha")
    parser.add_argument(
        "--checkerboard-input",
        action="store_true",
        help="Input has a light neutral checkerboard baked into RGB; convert it to alpha",
    )
    parser.add_argument(
        "--strip-detached-labels",
        action="store_true",
        help="Remove detached dark neutral frame-number labels above or below the main pose",
    )
    parser.add_argument("--transparent-threshold", type=float, default=12.0)
    parser.add_argument("--opaque-threshold", type=float, default=220.0)
    parser.add_argument(
        "--alpha-cutoff",
        type=int,
        default=0,
        help="Set alpha values at or below this threshold to fully transparent",
    )
    parser.add_argument(
        "--alpha-median-size",
        type=int,
        default=1,
        help="Median-filter alpha with this odd kernel size to suppress chroma speckle",
    )
    parser.add_argument(
        "--border-component-ratio",
        type=float,
        default=0.0,
        help="Clear border-connected alpha components no larger than this image-area ratio",
    )
    parser.add_argument(
        "--foreground-seed-threshold",
        type=int,
        default=0,
        help="Keep alpha only near components at or above this confidence threshold",
    )
    parser.add_argument(
        "--foreground-min-area",
        type=int,
        default=0,
        help="Minimum high-confidence component area to retain",
    )
    parser.add_argument(
        "--foreground-grow",
        type=int,
        default=0,
        help="Pixels to grow retained high-confidence components into soft edges",
    )
    parser.add_argument("--safe-margin", type=int, default=8)
    parser.add_argument("--normalize-width", type=int, default=0)
    parser.add_argument("--normalize-height", type=int, default=0)
    parser.add_argument("--content-width", type=int, default=0)
    parser.add_argument("--content-height", type=int, default=0)
    parser.add_argument("--bottom-margin", type=int, default=16)
    return parser


if __name__ == "__main__":
    raise SystemExit(process(build_parser().parse_args()))
