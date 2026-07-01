# Master cutouts v1

Generated 2026-06-30 from the approved character/enemy masters. Review-only;
nothing in this folder is wired into the live game.

- Canonical set: 37 subjects = 22 characters + 15 enemies.
- Output: `1024x1024` RGBA cutout sheet and checkerboard preview per subject.
- QA: 37/37 pass the 24px safe-margin and zero-edge-contact checks.
- Four source repairs are review candidates, not master replacements:
  `soulkey`, `fire_support`, `abyssal_cluster`, `elite_sentinel`.
  Their generated sources are under `../master-repairs-v1/`.
- Processing tool: `tools/keypose_board.py`.
- Gaze-corrected canonical cutouts for `ample`, `bright`, `fivehundred`, `jji`,
  and `sample` use the shorter `{id}_sheet.png` filename. Their
  `{id}_cutout_sheet.png` siblings are the superseded pre-correction versions.

Do not promote these into `assets/game/` until visual approval.
