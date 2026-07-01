# Enemy motion v3

Corrective review workspace for enemy facing-direction fixes.

| Enemy | Selected candidate | Processing QA | Visual QA | Live |
|---|---|---|---|---|
| `wasteland_gunner` | `candidate-v2` | PASS | PASS — unmistakable screen-left profile in all six poses | Promoted |

- Source board:
  `source/wasteland_gunner-left-v2.png`
- Pose order:
  `idle_low`, `idle_high`, `windup`, `release`, `recovery`, `hit`
- Output:
  2×3 sheet with six `384×480` RGBA frames.
- All six frames have at least `24px` transparent margin and zero alpha edge
  contact.
- The prior live sheet is backed up under
  `assets/game/enemy-motion-backup/20260630-213549/`.
- The new sheet is natively screen-left facing; no runtime mirroring is used.
