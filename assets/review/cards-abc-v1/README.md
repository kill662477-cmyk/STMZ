# ABC card-art batch review

- Source: `abc/*.png`
- Runtime IDs expected: 60
- Source IDs present: 60
- Final format: 1024×1024 opaque RGB PNG
- Exact duplicates: 0
- Perceptual duplicates: 0
- Missing/extra IDs: 0/0

## Review corrections

Fifteen source images had a bright generated-canvas rim. They were cropped by
12 pixels on every side and resized back to 1024×1024:

`acid_spray`, `aimedshot`, `bash`, `bulwark`, `doubleshot`, `expose`, `guard`,
`heavyshot`, `jdd_signature`, `pin`, `psiblade`, `quickshot`, `strike`,
`suppress`, `volley`.

`rang_signature` and `seventytwo_signature` were visually assigned to the
opposite race theme in the source folder. The final mapping is crossed:

- `rang_signature` uses the cyan/gold dimensional-star image from the source
  `seventytwo_signature.png`.
- `seventytwo_signature` uses the purple/green organic-spike image from the
  source `rang_signature.png`.

The source `abc` folder is unchanged. Promotable assets are in `final/`; contact
sheets and the machine QA report are in `final-qa/`.
