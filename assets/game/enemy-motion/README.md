# Live enemy textures

- 15 RGBA enemy textures, keyed by enemy ID.
- Act 1, Act 2, and Act 3 enemies use dedicated six-pose sheets.
- Runtime frame geometry and scale are configured in `src/game/pixi/BattleStage.ts`.
- Act 2 and Act 3 sheets are normalized by their 336 px alpha width. Wide ships
  use separate scale-span and visual-height values so hit effects stay aligned.
- Reviewed sources remain under `assets/review/enemy-motion-v2/`,
  `assets/review/act2-enemy-motion-v1/`, and
  `assets/review/act3-enemy-motion-v1/`.
- The corrected native screen-left `wasteland_gunner` sheet is reviewed under
  `assets/review/enemy-motion-v3/`; no runtime horizontal mirror is used.
