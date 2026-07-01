# Live character textures

- 22 RGBA character textures, keyed by character ID.
- `jdd.png` is present for completeness, but runtime keeps the legacy 25-frame JDD motion sheets.
- The other 21 characters use their dedicated cutout plus procedural race-specific attack effects.
- Source masters remain under `assets/masters/` and reviewed cutouts under `assets/review/master-cutouts-v1/`.
- For `ample`, `bright`, `fivehundred`, `jji`, and `sample`, the canonical corrected source is
  `assets/review/master-cutouts-v1/{id}/{id}_sheet.png`.
  The older `{id}_cutout_sheet.png` files predate the gaze-direction correction and must not be promoted.
- The superseded live files are backed up under
  `assets/game/characters-backup/20260630-162250/`.
