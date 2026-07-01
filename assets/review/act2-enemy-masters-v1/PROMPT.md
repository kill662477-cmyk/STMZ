# 2막 적 개별 마스터 v1 — 생성 프롬프트 (생성 대기)

- 상태: **프롬프트 완성, 생성 대기.** (이 Claude 세션엔 래스터 생성기 없음 → 코덱스 `imagegen` 또는 GPT Image / Nano Banana로 생성.)
- 선행: `assets/review/act2-enemy-concepts-v1/act2_enemy_concept_sheet_v1.png` 화풍을 사용자가 승인한 뒤 생성.
- 이유: act2 콘셉트 QA의 두 결함 해결 — (1) 셀 경계 침범 → 전신·넉넉한 여백 강제, (2) 어두운 배경=스프라이트 불가 → **평면 #00ff00 크로마** 강제(키포즈 보드/`keypose_board.py` 자동 분리용).
- 출력: 각 1024² 이상, 저장 `assets/review/act2-enemy-masters-v1/{id}_master_v1.png`. 생성 후 QA(전신·경계 비접촉·평면 크로마) 통과분만 사용자 승인 → `assets/masters/{id}/` 승격 → 키포즈 보드(`enemy-motion-gpt-board-v1` 형식) 진행.
- 화풍 기준: `tools/aether_asset_prompts.json`의 `globalStyle`/`negativePrompt`, 기존 `sentinel_scout.png`·`brood_queen.png`.

공통 머리말(모든 프롬프트에 적용):
> HAND-PAINTED 2D illustration, Slay-the-Spire dark-fantasy tone: painterly brushwork, thick dark outlines, muted dark palette with a few saturated accents, dramatic side lighting, gritty texture. CHIBI proportions (large head, small body). STRICT SIDE VIEW facing LEFT (toward the player). Full body head-to-toe, centered, generous safe padding on all sides, nothing touching the image edge. Perfectly flat uniform solid #00ff00 chroma background, no gradient/shadow/floor/texture. NOT glossy 3D, NOT a smooth mobile render, no front view, no card frame, no UI, no text, no logo, no watermark, no color fringe.

---

## 1. void_stalker — 공허 추적자 (P 일반)

```text
Use case: stylized-concept
Asset type: SLAY THE MONSTARZ Act 2 enemy master sprite — single isolated subject
Primary request: One original chibi dark-fantasy enemy, the Void Stalker, full body, strict side view facing LEFT, centered with generous padding on a flat solid #00ff00 background. A compact hovering Protoss-style hunter: smooth symmetrical ancient-relic armor, crescent-moon silhouette, paired cyan-and-violet resonance rings orbiting the body, a single sharp glowing eye, thin phase-strike fins. Hovering battle-ready idle, menacing but mid-tier (clearly smaller than a boss).
Style/medium: hand-painted dark-fantasy 2D, thick dark contour, rough ancient-relic texture, muted tarnished gold with luminous cyan/violet accents; no glossy sci-fi.
Constraints: original design, strong readable silhouette at small combat size, complete body fully inside frame with safe margins, crisp isolated edges, flat #00ff00 chroma everywhere. Do not use #00ff00 in the subject.
Avoid: franchise unit copies, glossy 3D, plastic mobile surfaces, front-facing pose, cropped fins/rings, extra creatures, text, logo, watermark.
```

## 2. siege_marauder — 공성 약탈자 (T 일반)

```text
Use case: stylized-concept
Asset type: SLAY THE MONSTARZ Act 2 enemy master sprite — single isolated subject
Primary request: One original chibi dark-fantasy enemy, the Siege Marauder, full body, strict side view facing LEFT, centered with generous padding on a flat solid #00ff00 background. A squat rusted industrial artillery raider: heavy riveted iron armor, twin recoil cannons, glowing furnace vents, heavy forward-leaning aggressive stance. Terran-style worn utilitarian metal, mercenary grit.
Style/medium: hand-painted dark-fantasy 2D, thick dark contour, rough rusted-metal texture, charcoal and tarnished iron with ember-orange furnace accents; no glossy sci-fi.
Constraints: original design, strong readable silhouette, complete body inside frame with safe margins, crisp isolated edges, flat #00ff00 chroma everywhere. Do not use #00ff00 in the subject.
Avoid: franchise unit copies, glossy 3D, plastic surfaces, front-facing pose, cropped cannons/vents, extra subjects, text, logo, watermark.
```

## 3. chitin_brute — 키틴 야수 (Z 일반)

```text
Use case: stylized-concept
Asset type: SLAY THE MONSTARZ Act 2 enemy master sprite — single isolated subject
Primary request: One original chibi dark-fantasy enemy, the Chitin Brute, full body, strict side view facing LEFT, centered with generous padding on a flat solid #00ff00 background. A low quadrupedal charging beast: asymmetric layered chitin plates, a blunt horned skull, massive forelimbs, acid vents along the back. Zerg-style organic menace, grounded and heavy.
Style/medium: hand-painted dark-fantasy 2D, thick dark contour, rough organic carapace texture, purple-black chitin with acid-yellow and magenta biological accents; no glossy sci-fi.
Constraints: original design, strong readable silhouette, complete body inside frame with safe margins (horns and limbs fully visible), crisp isolated edges, flat #00ff00 chroma everywhere. Do not use #00ff00 in the subject.
Avoid: franchise unit copies, glossy 3D, plastic surfaces, front-facing pose, cropped horns/limbs, extra creatures, text, logo, watermark.
```

## 4. resonance_warden — 공명 파수관 (P 엘리트)

```text
Use case: stylized-concept
Asset type: SLAY THE MONSTARZ Act 2 ELITE enemy master sprite — single isolated subject
Primary request: One original chibi dark-fantasy elite enemy, the Resonance Warden, full body, strict side view facing LEFT, centered with generous padding on a flat solid #00ff00 background. A larger ceremonial floating executioner: obsidian-and-aged-gold armor, several orbiting shield slabs, an imposing resonance-wave weapon. Clearly more elite and massive than the Void Stalker, regal and threatening.
Style/medium: hand-painted dark-fantasy 2D, thick dark contour, rough obsidian-and-gold relic texture, deep black with tarnished gold and cyan/violet energy; no glossy sci-fi.
Constraints: original design, elite-tier silhouette (bigger than normal P enemy), complete body and all orbiting slabs inside frame with safe margins, crisp isolated edges, flat #00ff00 chroma everywhere. Do not use #00ff00 in the subject.
Avoid: franchise unit copies, glossy 3D, plastic surfaces, front-facing pose, cropped weapon/shield slabs, extra subjects, text, logo, watermark.
```

## 5. abyssal_charger — 심연의 돌격수 (Z 보스)

```text
Use case: stylized-concept
Asset type: SLAY THE MONSTARZ Act 2 BOSS master sprite — single isolated subject
Primary request: One original chibi dark-fantasy BOSS, the Abyssal Charger, full body, strict side view facing LEFT, centered with extra-generous padding on a flat solid #00ff00 background. An enormous low-slung armored charger: wedge-shaped armored head, two original scythe tusks, dense black-purple carapace, glowing abyssal-magenta sacs. Unmistakable boss mass — much larger and more imposing than any normal enemy. Coiled, about to charge.
Style/medium: hand-painted dark-fantasy 2D, thick dark contour, rough heavy-carapace texture, blackened violet chitin with abyssal magenta and bone accents; no glossy sci-fi. Boss-quality detail.
Constraints: original design, boss-scale silhouette, ENTIRE body including both forward tusks fully inside frame with wide safe margins (the act2 concept clipped the front tusk — do not crop it here), crisp isolated edges, flat #00ff00 chroma everywhere. Do not use #00ff00 in the subject.
Avoid: franchise unit copies, glossy 3D, plastic surfaces, front-facing pose, cropped tusks/head/carapace, extra creatures, text, logo, watermark.
```
