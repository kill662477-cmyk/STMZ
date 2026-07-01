# Final prompt set

## Sentinel scout — base 3×2 board

```text
Use case: precise-object-edit
Asset type: production sprite-board test for SLAY THE MONSTARZ enemy sentinel_scout
Input images: Image 1 is the approved master and strict identity/design reference for every cell.
Primary request: Create a clean 3-column × 2-row animation key-pose sprite board containing exactly six separate full-body drawings of the SAME sentinel. Reading left-to-right, top row then bottom row: (1) idle lower hover, body compressed 3%; (2) idle upper hover, body extended 3%; (3) ranged attack wind-up, body leans right and eye narrows; (4) ranged attack release, body snaps left and eye opens bright, no projectile; (5) recovery, body recoils right and settles; (6) hit reaction, body tilts right and eye squints. All six face screen-left. Each cell must preserve the exact same armor construction, proportions, cyan energy line, and exactly five separate rune shards arranged as two on the left and three on the right. Pose changes only; no redesign.
Style/medium: match the approved master exactly: hand-painted dark-fantasy 2D, thick dark outlines, rough ancient golden relic texture, muted low-saturation gold, cyan accents, no glossy 3D.
Composition/framing: one square board divided logically into an invisible 3×2 grid; one centered character per cell; identical camera angle, identical scale, identical vertical baseline and generous internal cell padding. Entire silhouette and all shards stay inside each cell. No visible grid lines, borders, labels, captions, numbers, or text.
Scene/backdrop: perfectly flat uniform solid #00ff00 chroma-key fills the entire board and every gap, with no gradient, vignette, texture, shadow, floor, or lighting variation.
Constraints: exactly six characters total, one per cell; exact same character identity and part count in all cells; exactly five shards in every cell; crisp isolated edges; no overlap across cell boundaries; no emitted VFX. Do not use #00ff00 in subjects.
Avoid: missing/extra/merged shards, character redesign, cell border, panel frame, text, projectile, beam, flash, explosion, smoke, sparks, speed lines, motion blur, cast shadow, cropping, edge contact, frontal view, glossy 3D, contact-sheet labels.
```

Reference: `assets/masters/sentinel_scout/sentinel_scout_master.png`.

## Sentinel scout — safe-cell correction

```text
Keep the same six poses and 3×2 ordering, but shrink each complete pose group (body plus five shards) to about 72% and recenter it inside its own logical cell. Preserve exactly five separate shards, with two left and three right. Create wide uninterrupted #00ff00 gutters and reserve at least 12% horizontal and 10% vertical padding in every cell. Change only scale and placement; preserve the approved hand-painted design. No grid, labels, VFX, overlap, or boundary contact.
```

## Brood queen — base 2×3 board

```text
Use case: precise-object-edit
Asset type: production 2-column × 3-row key-pose sprite board for SLAY THE MONSTARZ boss brood_queen
Input images: Image 1 is the approved master and strict identity, anatomy, palette, and rendering reference for every cell.
Primary request: Create exactly six separate full-body drawings of the SAME brood queen on one square sprite board arranged in an invisible 2-column × 3-row grid. Reading left-to-right, top-to-bottom: (1) idle inhale, chest and head raised 3%; (2) idle exhale, head and belly lowered 3%; (3) melee wind-up, body coils toward screen-right and head pulls back while claws brace; (4) bite release, head and open jaws thrust toward screen-left while the heavy body remains grounded, no attack effects; (5) recovery, head retracts and foreclaws absorb the weight; (6) hit reaction, head recoils toward screen-right and near foreclaw lifts slightly. Every pose faces screen-left. Preserve the exact same creature design, silhouette vocabulary, dorsal spike pattern, limbs, purple organs, translucent yellow egg-sac cluster, teeth, tubes, and dark chitin across all six cells.
Style/medium: match the approved master exactly: hand-painted dark-fantasy 2D, thick dark outlines, rough organic brush texture, low-saturation purple-black chitin with bone spikes and toxic yellow accents; no glossy 3D.
Composition/framing: exact invisible 2×3 grid on one square board; one complete queen centered in each wide cell; every queen uses identical camera angle and scale. Keep empty green padding inside every cell and wide uninterrupted green gutters between cells. No visible grid lines, labels, captions, numbers, or text.
Scene/backdrop: perfectly flat uniform solid #00ff00 across the entire board and all gutters, no gradient, vignette, texture, floor, cast shadow, reflection, or lighting variation.
Constraints: exactly six queens total, one per cell; same anatomy and part count in every cell; pose changes only; complete silhouette visible; crisp isolated edges. Keep saliva modest and attached; no emitted VFX. Do not use #00ff00 in subjects.
Avoid: redesign, missing limbs or spikes, extra heads or limbs, changed egg-sac arrangement, pose overlap, cell border, text, projectile, beam, explosion, blood spray, smoke, sparks, speed lines, motion blur, cast shadow, cropping, edge contact, frontal view, glossy 3D.
```

Reference: `assets/masters/brood_queen/brood_queen_master.png`.

## Brood queen — safe-cell correction

```text
Keep the same six poses and 2×3 ordering, but shrink each complete queen independently to about 72% and recenter it inside its own logical cell. Reserve at least 14% empty #00ff00 padding on all four sides. Preserve anatomy, dorsal spikes, limbs, purple organs, egg-sac cluster, tubes, palette, and proportions. Change only scale and placement. No grid, labels, VFX, overlap, cropping, or boundary contact.
```
