# Act 3 enemy motion v1

Generated, processed, and promoted 2026-06-30.

| Enemy | Selected candidate | Processing QA | Visual QA |
|---|---:|---:|---|
| `interceptor` | `candidate-v2` | PASS | PASS — duplicate hit blade removed; release blade extension reads as a phase strike |
| `fire_support` | `candidate-v1` | PASS | PASS — dorsal cannon, nose battery, reactor, and paired engines retained |
| `abyssal_cluster` | `candidate-v2` | PASS | PASS — reduced layout scale prevents claws and feet crossing cell boundaries |
| `battleship_escort` | `candidate-v1` | PASS | PASS — forked nose, side cannon pod, ribbed hull, and cyan seams retained |
| `interstellar_battleship` | `candidate-v1` | PASS | PASS — main-barrel retraction, release extension, and complete boss hull retained |

Each selected board contains `idle_low`, `idle_high`, `windup`, `release`,
`recovery`, and `hit` in a 2×3 grid. Processed frames are normalized to
`384×480` RGBA with a `336×432` content box and `24px` bottom margin.

All 30 selected frames pass the `12px` safe-margin and zero-edge-contact
checks from `tools/keypose_board.py`.

Source boards are under `source/`. The rejected first attempts are retained for
comparison:

- `interceptor-v1.png`: hit pose duplicated the forward blade.
- `abyssal_cluster-v1.png`: top-row claws and feet crossed into middle-row cells.

`abyssal_cluster` uses a magenta source background so its yellow-green acid
details survive chroma removal. The corresponding `*-alpha.png` files are the
transparent inputs passed to `tools/keypose_board.py`.

Prompt manifest: `tools/act3_enemy_keypose_prompts.json`.

The selected sheets were promoted to `assets/game/enemy-motion/` after backing
up the prior static files under
`assets/game/enemy-motion-backup/20260630-172623/`.
