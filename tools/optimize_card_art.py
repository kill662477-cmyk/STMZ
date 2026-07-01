#!/usr/bin/env python3
"""Crop accidental bright canvas margins from square card art.

Writes review candidates only. Source assets are never modified.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image


def content_square(image: Image.Image, threshold: float) -> tuple[int, int, int, int]:
    rgb = np.asarray(image.convert("RGB"), dtype=np.uint8)
    luminance = rgb.astype(np.float32).mean(axis=2)
    ys, xs = np.nonzero(luminance < threshold)
    if len(xs) == 0:
        return (0, 0, image.width, image.height)

    left, top = int(xs.min()), int(ys.min())
    right, bottom = int(xs.max()) + 1, int(ys.max()) + 1
    crop_size = min(right - left, bottom - top)
    center_x = (left + right) / 2
    center_y = (top + bottom) / 2
    crop_left = int(round(center_x - crop_size / 2))
    crop_top = int(round(center_y - crop_size / 2))
    crop_left = max(left, min(crop_left, right - crop_size))
    crop_top = max(top, min(crop_top, bottom - crop_size))
    return crop_left, crop_top, crop_left + crop_size, crop_top + crop_size


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input-dir", default="assets/game/cards")
    parser.add_argument("--output-dir", default="assets/review/cards-optimized-v1")
    parser.add_argument("--only", required=True, help="Comma-separated card ids")
    parser.add_argument("--threshold", type=float, default=235)
    parser.add_argument(
        "--fixed-inset",
        type=int,
        default=0,
        help="Crop this many pixels from every edge instead of threshold detection",
    )
    parser.add_argument(
        "--no-crop",
        action="store_true",
        help="Keep the full image and only normalize it to optimized RGB PNG",
    )
    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    for card_id in [value.strip() for value in args.only.split(",") if value.strip()]:
        source = input_dir / f"{card_id}.png"
        image = Image.open(source).convert("RGB")
        if args.no_crop:
            crop = (0, 0, image.width, image.height)
        elif args.fixed_inset > 0:
            inset = args.fixed_inset
            if inset * 2 >= min(image.size):
                raise ValueError(f"Fixed inset is too large for {source}: {inset}")
            crop = (inset, inset, image.width - inset, image.height - inset)
        else:
            crop = content_square(image, args.threshold)
        optimized = image.crop(crop).resize((1024, 1024), Image.Resampling.LANCZOS)
        destination = output_dir / f"{card_id}.png"
        optimized.save(destination, optimize=True)
        print(f"{card_id}: crop={crop} -> {destination}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
