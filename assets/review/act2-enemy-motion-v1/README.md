# Act 2 enemy motion v1

Generated and processed 2026-06-30. Review-only; no live textures were replaced.

| Enemy | Selected candidate | Processing QA | Visual QA |
|---|---:|---:|---|
| `void_stalker` | `candidate-v2` | PASS | PASS — paired resonance rings restored in release |
| `siege_marauder` | `candidate-v1` | PASS | PASS — two cannons and two exhaust stacks retained |
| `chitin_brute` | `candidate-v1` | PASS | PASS — left-facing quadruped anatomy and vents retained |
| `resonance_warden` | `candidate-v1` | PASS | PASS — exactly eight shield slabs retained per pose |
| `abyssal_charger` | `candidate-v2` | PASS | PASS — exactly two complete scythe tusks retained per pose |

Each selected board contains `idle_low`, `idle_high`, `windup`, `release`,
`recovery`, and `hit` in a 2x3 grid. Processed frames are normalized to
`384x480` RGBA with a `336x432` content box and `24px` bottom margin.

All 30 selected frames pass the `12px` safe-margin and zero-edge-contact
checks from `tools/keypose_board.py`.

Source boards are under `source/`. The rejected first attempts are retained for
comparison:

- `void_stalker-v1.png`: release frame lost its resonance rings.
- `abyssal_charger-v1.png`: hit frame lost the pair of scythe tusks.

Do not promote or wire these into `assets/game/` until visual approval.
