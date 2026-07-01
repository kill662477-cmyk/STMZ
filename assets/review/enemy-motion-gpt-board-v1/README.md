# Enemy motion key-pose board v1

- Status: approved and promoted to local live game assets on 2026-06-28.
- Generator: built-in GPT image generation with approved repository masters as references.
- AetherForge / make-sprite: not used.
- Live game assets: `assets/game/sentinel_scout_motion_sheet.png`, `assets/game/brood_queen_motion_sheet.png`.

## Candidates

- `sentinel_scout/candidate-safe/sentinel_scout_keypose_preview.png`
  - 3×2: idle low, idle high, wind-up, release, recovery, hit.
- `brood_queen/candidate-safe/brood_queen_keypose_preview.png`
  - 2×3: idle inhale, idle exhale, wind-up, release, recovery, hit.

Both candidates passed a 12px safe-margin check with zero alpha pixels touching a cell edge. See each `qa-report.json`.

Game-ready normalized outputs are under each character's `game-ready/` directory. Sentinel cells are `384×480`; queen cells are `640×384`. Both use a 24px bottom margin.

## Re-run QA

```powershell
python .\tools\keypose_board.py `
  --input .\assets\review\enemy-motion-gpt-board-v1\sentinel_scout\source\sentinel_scout_keypose_board_safe_source.png `
  --output-dir .\assets\review\enemy-motion-gpt-board-v1\sentinel_scout\candidate-safe `
  --name sentinel_scout_keypose --cols 3 --rows 2 `
  --names idle_low,idle_high,windup,release,recovery,hit --safe-margin 12

python .\tools\keypose_board.py `
  --input .\assets\review\enemy-motion-gpt-board-v1\brood_queen\source\brood_queen_keypose_board_safe_source.png `
  --output-dir .\assets\review\enemy-motion-gpt-board-v1\brood_queen\candidate-safe `
  --name brood_queen_keypose --cols 2 --rows 3 `
  --names idle_inhale,idle_exhale,windup,release,recovery,hit --safe-margin 12
```

Generation prompts are recorded in `PROMPTS.md`.
