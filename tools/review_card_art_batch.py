#!/usr/bin/env python3
"""Audit a complete card-art folder and create labeled review contact sheets."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont


CARD_KEY = re.compile(r"^\s{2}([a-z0-9_]+): \{", re.MULTILINE)
THUMB_SIZE = 192
LABEL_HEIGHT = 30
CONTACT_COLS = 5


def source_card_ids(repo: Path) -> tuple[list[str], list[str]]:
    battle_text = (repo / "src/content/battleContent.ts").read_text(encoding="utf-8")
    common_block = battle_text.split("const T_STARTER", 1)[0]
    common_ids = CARD_KEY.findall(common_block)
    signature_text = (repo / "src/content/signatureCards.ts").read_text(encoding="utf-8")
    signature_ids = CARD_KEY.findall(signature_text)
    return common_ids, signature_ids


def font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in (
        Path("C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/malgun.ttf"),
    ):
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def perceptual_hash(image: Image.Image) -> str:
    gray = np.asarray(image.convert("L").resize((16, 16), Image.Resampling.LANCZOS))
    bits = gray >= np.median(gray)
    return "".join("1" if value else "0" for value in bits.ravel())


def analyze(path: Path) -> dict[str, object]:
    image = Image.open(path).convert("RGBA")
    array = np.asarray(image, dtype=np.uint8)
    rgb = array[:, :, :3].astype(np.float32)
    alpha = array[:, :, 3]
    luminance = rgb.mean(axis=2)
    border = np.concatenate(
        (luminance[0], luminance[-1], luminance[:, 0], luminance[:, -1])
    )
    return {
        "id": path.stem,
        "file": str(path),
        "width": image.width,
        "height": image.height,
        "mode": Image.open(path).mode,
        "alpha_min": int(alpha.min()),
        "alpha_max": int(alpha.max()),
        "transparent_pixels": int((alpha == 0).sum()),
        "mean_luminance": round(float(luminance.mean()), 3),
        "border_luminance": round(float(border.mean()), 3),
        "bright_border_ratio": round(float((border >= 240).mean()), 6),
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "perceptual_hash": perceptual_hash(image),
        "status": "pass"
        if image.size == (1024, 1024) and int(alpha.min()) == 255
        else "review",
    }


def contact_sheet(
    ids: list[str],
    source_dir: Path,
    destination: Path,
) -> None:
    rows = (len(ids) + CONTACT_COLS - 1) // CONTACT_COLS
    cell_height = THUMB_SIZE + LABEL_HEIGHT
    sheet = Image.new(
        "RGB",
        (CONTACT_COLS * THUMB_SIZE, rows * cell_height),
        (13, 16, 20),
    )
    draw = ImageDraw.Draw(sheet)
    label_font = font(15)
    for index, card_id in enumerate(ids):
        image = Image.open(source_dir / f"{card_id}.png").convert("RGB")
        image.thumbnail((THUMB_SIZE, THUMB_SIZE), Image.Resampling.LANCZOS)
        x = (index % CONTACT_COLS) * THUMB_SIZE
        y = (index // CONTACT_COLS) * cell_height
        sheet.paste(image, (x, y))
        draw.rectangle(
            (x, y + THUMB_SIZE, x + THUMB_SIZE, y + cell_height),
            fill=(13, 16, 20),
        )
        draw.text(
            (x + 6, y + THUMB_SIZE + 6),
            card_id,
            font=label_font,
            fill=(234, 238, 241),
        )
    sheet.save(destination, optimize=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input-dir", default="abc")
    parser.add_argument("--output-dir", default="assets/review/cards-abc-v1")
    args = parser.parse_args()

    repo = Path.cwd()
    source_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    common_ids, signature_ids = source_card_ids(repo)
    expected = set(common_ids + signature_ids)
    actual = {path.stem for path in source_dir.glob("*.png")}
    missing = sorted(expected - actual)
    extra = sorted(actual - expected)
    reports = [analyze(source_dir / f"{card_id}.png") for card_id in sorted(actual)]

    exact_groups: dict[str, list[str]] = {}
    perceptual_groups: dict[str, list[str]] = {}
    for report in reports:
        exact_groups.setdefault(str(report["sha256"]), []).append(str(report["id"]))
        perceptual_groups.setdefault(str(report["perceptual_hash"]), []).append(
            str(report["id"])
        )
    exact_duplicates = [ids for ids in exact_groups.values() if len(ids) > 1]
    perceptual_duplicates = [
        ids for ids in perceptual_groups.values() if len(ids) > 1
    ]

    common_sorted = sorted(common_ids)
    signature_sorted = sorted(signature_ids)
    groups = {
        "common-1": common_sorted[:20],
        "common-2": common_sorted[20:],
        "signatures-1": signature_sorted[:10],
        "signatures-2": signature_sorted[10:],
    }
    for name, ids in groups.items():
        contact_sheet(ids, source_dir, output_dir / f"{name}.png")

    summary = {
        "input_dir": str(source_dir),
        "expected_count": len(expected),
        "actual_count": len(actual),
        "missing": missing,
        "extra": extra,
        "dimension_passed": sum(
            report["width"] == 1024 and report["height"] == 1024
            for report in reports
        ),
        "opaque_passed": sum(report["alpha_min"] == 255 for report in reports),
        "exact_duplicates": exact_duplicates,
        "perceptual_duplicates": perceptual_duplicates,
        "assets": reports,
    }
    (output_dir / "qa-report.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0 if not missing and not extra else 2


if __name__ == "__main__":
    raise SystemExit(main())
