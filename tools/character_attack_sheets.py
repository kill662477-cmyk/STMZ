#!/usr/bin/env python3
"""Process 5x5 character attack boards with baked checkerboard backgrounds.

The input boards are AI-arranged pose grids rather than mathematically exact
cells. This tool detects the five row/column anchors from the character
components, assigns detached VFX to the nearest pose, preserves a consistent
scale across all 25 frames, and writes review-only RGBA sheets plus QA reports.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

from keypose_board import (
    analyze_frame,
    checkerboard,
    frame_bounds,
    remove_baked_checkerboard,
    strip_detached_neutral_labels,
)


ALIASES = {
    "72": "seventytwo",
    "jdd": "jdd",
}
NORMALIZATION_OVERRIDES = {
    # These two boards use wider muzzle flashes / lower recoil poses than the
    # batch average, so a small per-character reduction preserves 8px safety.
    "fivehundred": {"content_height": 200, "bottom_margin": 36},
    "sun": {"content_height": 195},
    "tyson": {"bottom_margin": 36},
}
GRID_SIZE = 5
FRAME_COUNT = GRID_SIZE * GRID_SIZE
INTERNAL_SIZE = 320
INTERNAL_ORIGIN = INTERNAL_SIZE // 2


def stable_id(path: Path) -> str:
    stem = path.stem.lower()
    return ALIASES.get(stem, stem)


def fit_axis(values: list[float], size: int) -> tuple[np.ndarray, float]:
    centers = (np.arange(GRID_SIZE, dtype=np.float64) + 0.5) * size / GRID_SIZE
    data = np.asarray(values, dtype=np.float64)
    for _ in range(12):
        groups = np.argmin(np.abs(data[:, None] - centers[None, :]), axis=1)
        updated = centers.copy()
        for index in range(GRID_SIZE):
            members = data[groups == index]
            if len(members):
                updated[index] = np.median(members)
        centers = updated
    stride, start = np.polyfit(np.arange(GRID_SIZE), centers, 1)
    return start + stride * np.arange(GRID_SIZE), float(stride)


def connected_components(alpha: np.ndarray) -> tuple[np.ndarray, list[tuple[slice, slice] | None]]:
    labels, _ = ndimage.label(alpha > 24, structure=np.ones((3, 3), dtype=np.uint8))
    return labels, list(ndimage.find_objects(labels))


def main_components(
    labels: np.ndarray,
    objects: list[tuple[slice, slice] | None],
) -> list[dict[str, object]]:
    minimum_area = max(1500, int(labels.size * 0.0008))
    result: list[dict[str, object]] = []
    for label, bounds in enumerate(objects, 1):
        if bounds is None:
            continue
        local = labels[bounds] == label
        area = int(local.sum())
        height = bounds[0].stop - bounds[0].start
        width = bounds[1].stop - bounds[1].start
        if area < minimum_area or height < 80:
            continue
        local_y, local_x = np.nonzero(local)
        result.append(
            {
                "label": label,
                "area": area,
                "width": width,
                "height": height,
                "center_x": float((local_x + bounds[1].start).mean()),
                "center_y": float((local_y + bounds[0].start).mean()),
            }
        )
    if not 20 <= len(result) <= 30:
        raise ValueError(f"Expected roughly 25 main pose components, found {len(result)}")
    return result


def copy_pixels(
    target: np.ndarray,
    source: np.ndarray,
    source_y: np.ndarray,
    source_x: np.ndarray,
    *,
    anchor_x: float,
    anchor_y: float,
) -> None:
    output_x = np.rint(source_x - anchor_x + INTERNAL_ORIGIN).astype(np.int32)
    output_y = np.rint(source_y - anchor_y + INTERNAL_ORIGIN).astype(np.int32)
    inside = (
        (output_x >= 0)
        & (output_x < INTERNAL_SIZE)
        & (output_y >= 0)
        & (output_y < INTERNAL_SIZE)
    )
    target[output_y[inside], output_x[inside]] = source[source_y[inside], source_x[inside]]


def keep_largest_piece(frame: np.ndarray) -> np.ndarray:
    visible = frame[:, :, 3] > 24
    labels, count = ndimage.label(visible, structure=np.ones((3, 3), dtype=np.uint8))
    if count <= 1:
        return frame
    areas = np.bincount(labels.ravel())
    areas[0] = 0
    largest = int(areas.argmax())
    cleaned = frame.copy()
    cleaned[labels != largest] = 0
    return cleaned


def extract_internal_frames(board: Image.Image) -> tuple[list[Image.Image], dict[str, object]]:
    array = np.asarray(board.convert("RGBA"), dtype=np.uint8)
    labels, objects = connected_components(array[:, :, 3])
    poses = main_components(labels, objects)
    x_centers, x_stride = fit_axis([float(pose["center_x"]) for pose in poses], array.shape[1])
    y_centers, y_stride = fit_axis([float(pose["center_y"]) for pose in poses], array.shape[0])
    frames = [
        np.zeros((INTERNAL_SIZE, INTERNAL_SIZE, 4), dtype=np.uint8)
        for _ in range(FRAME_COUNT)
    ]
    large_labels = {int(pose["label"]) for pose in poses}
    pose_slots: dict[int, int] = {}
    slot_occupancy = np.zeros(FRAME_COUNT, dtype=np.int32)
    for pose in poses:
        column = int(np.argmin(np.abs(x_centers - float(pose["center_x"]))))
        row = int(np.argmin(np.abs(y_centers - float(pose["center_y"]))))
        target_index = row * GRID_SIZE + column
        pose_slots[int(pose["label"])] = target_index
        slot_occupancy[target_index] += 1

    for pose in poses:
        label = int(pose["label"])
        source_y, source_x = np.nonzero(labels == label)
        center_x = float(pose["center_x"])
        center_y = float(pose["center_y"])
        column = int(np.argmin(np.abs(x_centers - center_x)))
        row = int(np.argmin(np.abs(y_centers - center_y)))
        own_index = pose_slots[label]
        width = int(pose["width"])
        height = int(pose["height"])
        if width > x_stride * 1.45 or height > y_stride * 1.45:
            normalized_x = np.abs(source_x[:, None] - x_centers[None, :]) / x_stride
            normalized_y = np.abs(source_y[:, None] - y_centers[None, :]) / y_stride
            distance = normalized_y[:, :, None] ** 2 + normalized_x[:, None, :] ** 2
            nearest = np.argmin(distance.reshape(len(source_x), FRAME_COUNT), axis=1)
            # A long muzzle flash or slash can cross the mathematical midpoint
            # into an adjacent, already occupied pose slot. Keep those pixels
            # with their originating pose. Only split into an empty slot when
            # the source really contains two poses joined by touching pixels.
            occupied_neighbor = (nearest != own_index) & (slot_occupancy[nearest] > 0)
            nearest[occupied_neighbor] = own_index
            for target_index in np.unique(nearest):
                selected = nearest == target_index
                target_row = int(target_index) // GRID_SIZE
                target_column = int(target_index) % GRID_SIZE
                fragment = np.zeros_like(frames[int(target_index)])
                copy_pixels(
                    fragment,
                    array,
                    source_y[selected],
                    source_x[selected],
                    anchor_x=float(x_centers[target_column]),
                    anchor_y=float(y_centers[target_row]),
                )
                fragment = keep_largest_piece(fragment)
                frames[int(target_index)] = np.maximum(frames[int(target_index)], fragment)
        else:
            target_index = row * GRID_SIZE + column
            copy_pixels(
                frames[target_index],
                array,
                source_y,
                source_x,
                anchor_x=float(x_centers[column]),
                anchor_y=float(y_centers[row]),
            )

    # Detached muzzle flashes, shell casings, crystals, and slash particles are
    # smaller than the main character component. Assign them after the poses.
    for label, bounds in enumerate(objects, 1):
        if bounds is None or label in large_labels:
            continue
        local_y, local_x = np.nonzero(labels[bounds] == label)
        if len(local_x) == 0:
            continue
        source_y = local_y + bounds[0].start
        source_x = local_x + bounds[1].start
        center_x = float(source_x.mean())
        center_y = float(source_y.mean())
        column = int(np.argmin(np.abs(x_centers - center_x)))
        row = int(np.argmin(np.abs(y_centers - center_y)))
        target_index = row * GRID_SIZE + column
        copy_pixels(
            frames[target_index],
            array,
            source_y,
            source_x,
            anchor_x=float(x_centers[column]),
            anchor_y=float(y_centers[row]),
        )

    cleaned_frames: list[Image.Image] = []
    removed_components = 0
    for frame in frames:
        cleaned, removed = strip_detached_neutral_labels(Image.fromarray(frame))
        cleaned_frames.append(cleaned)
        removed_components += removed
    metadata = {
        "detected_main_components": len(poses),
        "anchors": {
            "x": [round(float(value), 3) for value in x_centers],
            "y": [round(float(value), 3) for value in y_centers],
            "x_stride": round(x_stride, 3),
            "y_stride": round(y_stride, 3),
        },
        "removed_detached_neutral_components": removed_components,
    }
    return cleaned_frames, metadata


def largest_component_bounds(frame: Image.Image) -> tuple[int, int, int, int]:
    alpha = np.asarray(frame.getchannel("A"), dtype=np.uint8)
    labels, count = ndimage.label(alpha > 24, structure=np.ones((3, 3), dtype=np.uint8))
    if count == 0:
        raise ValueError("Empty extracted frame")
    areas = np.bincount(labels.ravel())
    areas[0] = 0
    label = int(areas.argmax())
    y, x = np.nonzero(labels == label)
    return int(x.min()), int(y.min()), int(x.max()) + 1, int(y.max()) + 1


def dense_body_anchor(frame: Image.Image) -> tuple[float, float]:
    """Estimate torso center and grounded bottom without thin VFX dominating."""

    rgba = np.asarray(frame.convert("RGBA"), dtype=np.float32)
    rgb = rgba[:, :, :3]
    luminance = (
        rgb[:, :, 0] * 0.2126
        + rgb[:, :, 1] * 0.7152
        + rgb[:, :, 2] * 0.0722
    )
    body = (rgba[:, :, 3] > 64.0) & (luminance < 190.0)
    column_mass = body.sum(axis=0).astype(np.float64)
    if float(column_mass.max()) <= 0:
        left, _, right, bottom = largest_component_bounds(frame)
        return (left + right) / 2, float(bottom)
    dense = column_mass >= max(5.0, float(column_mass.max()) * 0.42)
    columns = np.arange(body.shape[1], dtype=np.float64)
    center_x = float(np.average(columns[dense], weights=column_mass[dense]))
    band_left = max(0, int(round(center_x)) - 65)
    band_right = min(body.shape[1], int(round(center_x)) + 66)
    body_y, _ = np.nonzero(body[:, band_left:band_right])
    if len(body_y) == 0:
        _, _, _, bottom = largest_component_bounds(frame)
        return center_x, float(bottom)
    return center_x, float(np.percentile(body_y, 99.5) + 1.0)


def normalize_animation(
    frames: list[Image.Image],
    *,
    frame_size: int,
    content_height: int,
    bottom_margin: int,
) -> tuple[list[Image.Image], dict[str, object]]:
    reference_bounds = [largest_component_bounds(frame) for frame in frames[:GRID_SIZE]]
    median_height = float(np.median([bottom - top for _, top, _, bottom in reference_bounds]))
    scale = content_height / median_height
    source_origin = INTERNAL_ORIGIN
    target_origin = frame_size / 2
    body_anchors = [dense_body_anchor(frame) for frame in frames]
    body_centers = [center for center, _ in body_anchors]
    row_centers = [
        float(np.median(body_centers[row * GRID_SIZE : (row + 1) * GRID_SIZE]))
        for row in range(GRID_SIZE)
    ]
    horizontal_corrections = [
        float(np.clip(row_centers[index // GRID_SIZE] - center, -12.0, 12.0))
        for index, center in enumerate(body_centers)
    ]
    body_bottoms = [bottom for _, bottom in body_anchors]
    normalized: list[Image.Image] = []
    vertical_corrections: list[float] = []
    for index, frame in enumerate(frames):
        resized_size = max(1, int(round(INTERNAL_SIZE * scale)))
        resized = frame.resize((resized_size, resized_size), Image.Resampling.LANCZOS)
        paste_x = int(
            round(
                target_origin
                - source_origin * scale
                + horizontal_corrections[index] * scale
            )
        )
        paste_y = int(
            round(frame_size - bottom_margin - body_bottoms[index] * scale)
        )
        vertical_corrections.append(
            float(paste_y - (target_origin - source_origin * scale))
        )
        canvas = Image.new("RGBA", (frame_size, frame_size))
        canvas.alpha_composite(resized, (paste_x, paste_y))
        normalized.append(canvas)
    return normalized, {
        "frame_size": frame_size,
        "content_height": content_height,
        "bottom_margin": bottom_margin,
        "source_reference_height": round(median_height, 3),
        "scale": round(scale, 6),
        "alignment": {
            "row_body_centers": [round(value, 3) for value in row_centers],
            "horizontal_corrections": [
                round(value, 3) for value in horizontal_corrections
            ],
            "body_bottoms": [round(value, 3) for value in body_bottoms],
            "vertical_corrections": [
                round(value, 3) for value in vertical_corrections
            ],
        },
    }


def process_board(
    source_path: Path,
    output_root: Path,
    *,
    frame_size: int,
    content_height: int,
    bottom_margin: int,
    safe_margin: int,
) -> dict[str, object]:
    character_id = stable_id(source_path)
    output_dir = output_root / character_id
    frames_dir = output_dir / "frames"
    frames_dir.mkdir(parents=True, exist_ok=True)
    alpha_board = remove_baked_checkerboard(Image.open(source_path))
    extracted, extraction = extract_internal_frames(alpha_board)
    override = NORMALIZATION_OVERRIDES.get(character_id, {})
    frames, normalization = normalize_animation(
        extracted,
        frame_size=frame_size,
        content_height=int(override.get("content_height", content_height)),
        bottom_margin=int(override.get("bottom_margin", bottom_margin)),
    )
    sheet_size = (frame_size * GRID_SIZE, frame_size * GRID_SIZE)
    sheet = Image.new("RGBA", sheet_size)
    preview = checkerboard(sheet_size)
    analyses: list[dict[str, object]] = []
    for index, frame in enumerate(frames):
        frame_name = f"frame_{index:02d}"
        frame_path = frames_dir / f"{index:02d}_{frame_name}.png"
        frame.save(frame_path)
        x = (index % GRID_SIZE) * frame_size
        y = (index // GRID_SIZE) * frame_size
        sheet.alpha_composite(frame, (x, y))
        preview.alpha_composite(frame, (x, y))
        analysis = analyze_frame(frame, safe_margin=safe_margin)
        analysis.update({"index": index, "name": frame_name, "file": str(frame_path)})
        analyses.append(analysis)

    sheet_path = output_dir / f"{character_id}_sheet.png"
    preview_path = output_dir / f"{character_id}_preview.png"
    sheet.save(sheet_path)
    preview.save(preview_path)
    status = "pass" if all(frame["status"] == "pass" for frame in analyses) else "fail"
    report = {
        "id": character_id,
        "source": str(source_path),
        "sheet": str(sheet_path),
        "preview": str(preview_path),
        "grid": {"cols": GRID_SIZE, "rows": GRID_SIZE, "count": FRAME_COUNT},
        "background_mode": "baked-checkerboard",
        "extraction": extraction,
        "normalization": normalization,
        "safe_margin": safe_margin,
        "status": status,
        "frames": analyses,
    }
    (output_dir / "qa-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return report


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input-dir", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--frame-size", type=int, default=320)
    parser.add_argument("--content-height", type=int, default=210)
    parser.add_argument("--bottom-margin", type=int, default=28)
    parser.add_argument("--safe-margin", type=int, default=8)
    parser.add_argument(
        "--ids",
        default="",
        help="Optional comma-separated stable ids to process",
    )
    parser.add_argument(
        "--summary-only",
        action="store_true",
        help="Rebuild summary.json from existing per-character QA reports",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    source_dir = Path(args.input_dir)
    output_root = Path(args.output_dir)
    source_paths = sorted(
        (path for path in source_dir.glob("*.png") if not path.name.startswith("_")),
        key=lambda path: stable_id(path),
    )
    selected_ids = {value.strip() for value in args.ids.split(",") if value.strip()}
    if selected_ids:
        source_paths = [path for path in source_paths if stable_id(path) in selected_ids]
    if not source_paths:
        raise ValueError(f"No source PNG files found in {source_dir}")
    reports = []
    for source_path in source_paths:
        if args.summary_only:
            report_path = output_root / stable_id(source_path) / "qa-report.json"
            if not report_path.exists():
                raise ValueError(f"Missing QA report: {report_path}")
            report = json.loads(report_path.read_text(encoding="utf-8"))
        else:
            report = process_board(
                source_path,
                output_root,
                frame_size=args.frame_size,
                content_height=args.content_height,
                bottom_margin=args.bottom_margin,
                safe_margin=args.safe_margin,
            )
        reports.append(report)
        if not args.summary_only:
            print(
                f"{report['id']}: {report['status']} "
                f"({report['extraction']['detected_main_components']} main components)"
            )
    summary = {
        "source_dir": str(source_dir),
        "output_dir": str(output_root),
        "count": len(reports),
        "passed": sum(report["status"] == "pass" for report in reports),
        "failed": [report["id"] for report in reports if report["status"] != "pass"],
        "assets": [
            {
                "id": report["id"],
                "status": report["status"],
                "sheet": report["sheet"],
                "preview": report["preview"],
            }
            for report in reports
        ],
    }
    (output_root / "summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0 if summary["passed"] == summary["count"] else 2


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise
