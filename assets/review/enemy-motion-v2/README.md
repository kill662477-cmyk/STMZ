# Enemy motion v2

Act 1 key-pose pilot generated 2026-06-30. Review-only; no live textures were
replaced.

| Enemy | Layout | Processing QA | Visual status |
|---|---:|---:|---|
| `wasteland_gunner` | 2x3 | PASS | Ready for approval |
| `acid_stalker` | 2x3 | PASS | Ready for approval; hit frame was mirrored back to screen-left |
| `elite_sentinel` | 2x3 | PASS | Conditional: poses are readable, but orbiting shard count changes during attack/hit |

Each board contains `idle_low`, `idle_high`, `windup`, `release`, `recovery`,
and `hit`. Normalized outputs are stored below each enemy's `candidate-v1/`
folder. The source generations remain under `source/` and repair attempts under
`repair-source*/`.

No files have been promoted to `assets/game/` or connected in
`BattleStage.ts`.
