# CWE character attack sprites — review record

- Source: `cwe/*.png`
- Stable IDs: `72.png` → `seventytwo`, `JDD.png` → `jdd`
- Batch: 20 active characters
- Layout: 5 × 5 frames, 320 × 320 px per frame
- Output: transparent RGBA, 1600 × 1600 px sheet
- QA result: 20/20 passed (`summary.json`)

The source boards contained a baked light checkerboard rather than real alpha.
Processing removes border-connected background plus enclosed checker patches
between limbs and equipment while preserving eyes, highlights, muzzle flashes,
shells, and colored slash VFX. Detached frame-number labels are removed. Each
frame is then grounded to a common foot line and excessive row-local torso
offset is limited to reduce animation shake.

Approved sheets are promoted to `assets/game/character-motion/{id}.png`.
Static character cutouts remain the idle pose; these sheets are attack-only.
Runtime player silhouettes are normalized to the approved JDD height (208.38px).
No external storage or CDN publication is part of this batch.
