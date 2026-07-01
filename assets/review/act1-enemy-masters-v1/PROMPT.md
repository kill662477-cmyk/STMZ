# 1막 적 전용 마스터 v1 — 생성 프롬프트 (생성 대기)

- 상태: **프롬프트 완성, 생성 대기.** (현재 이 세 적은 임시로 `sentinel_scout` 텍스처를 공유 중.)
- 대상: `wasteland_gunner`(T), `acid_stalker`(Z), `elite_sentinel`(P 엘리트). `sentinel_scout`·`brood_queen`은 이미 전용 마스터 보유.
- 출력: 각 1024² 이상, 저장 `assets/review/act1-enemy-masters-v1/{id}_master_v1.png`. QA(전신·경계 비접촉·평면 크로마) 통과 → 사용자 승인 → `assets/masters/{id}/` 승격 → 키포즈 보드 → `battleContent.ts`의 `texture`와 `ENEMY_MOTION` 매핑을 신규 키로 교체.
- 화풍 기준: `tools/aether_asset_prompts.json` `globalStyle`/`negativePrompt`, 기존 `sentinel_scout.png`.

공통 머리말(모든 프롬프트 적용):
> HAND-PAINTED 2D, Slay-the-Spire dark-fantasy tone: painterly brushwork, thick dark outlines, muted dark palette with a few saturated accents, dramatic side lighting, gritty texture. CHIBI proportions. STRICT SIDE VIEW facing LEFT (toward the player). Full body head-to-toe, centered, generous safe padding, nothing touching the edge. Flat uniform solid #00ff00 chroma background (no gradient/shadow/floor). NOT glossy 3D, no front view, no card frame, no UI, no text, no logo, no watermark, no color fringe. Mid-tier normal-enemy scale (elite slightly larger), clearly smaller than a boss.

---

## 1. wasteland_gunner — 잔해 총잡이 (T 일반, HP 32)

```text
Use case: stylized-concept
Asset type: SLAY THE MONSTARZ Act 1 enemy master sprite — single isolated subject
Primary request: One original chibi dark-fantasy enemy, the Wasteland Gunner, full body, strict side view facing LEFT, centered with generous padding on a flat solid #00ff00 background. A scrappy Terran-style ranged raider: patched riveted armor, a bulky twin-barrel autogun, bandolier of shells, a battered helmet with a glowing visor slit, hunched aggressive firing stance. Worn utilitarian mercenary grit.
Style/medium: hand-painted dark-fantasy 2D, thick dark contour, rough rusted-metal texture, charcoal and rust with one ember-orange muzzle accent; no glossy sci-fi.
Constraints: original design, readable ranged-shooter silhouette, complete body and gun inside frame with safe margins, crisp isolated edges, flat #00ff00 chroma everywhere. Do not use #00ff00 in the subject.
Avoid: franchise unit copies, glossy 3D, plastic surfaces, front-facing pose, cropped gun/limbs, extra subjects, text, logo, watermark.
```

## 2. acid_stalker — 산성 추적자 (Z 일반, HP 34)

```text
Use case: stylized-concept
Asset type: SLAY THE MONSTARZ Act 1 enemy master sprite — single isolated subject
Primary request: One original chibi dark-fantasy enemy, the Acid Stalker, full body, strict side view facing LEFT, centered with generous padding on a flat solid #00ff00 background. A lean Zerg-style ambush predator: low serpentine body on clawed legs, segmented chitin, dripping acid maw, back-mounted spine launchers, a single baleful eye. Tense crouched stalking pose.
Style/medium: hand-painted dark-fantasy 2D, thick dark contour, rough organic carapace texture, purple-black chitin with acid-yellow drip and magenta accents; no glossy sci-fi.
Constraints: original design, readable stalker silhouette, complete body, legs and spines inside frame with safe margins, crisp isolated edges, flat #00ff00 chroma everywhere. Do not use #00ff00 in the subject.
Avoid: franchise unit copies, glossy 3D, plastic surfaces, front-facing pose, cropped spines/legs, extra creatures, text, logo, watermark.
```

## 3. elite_sentinel — 정예 파수병 (P 엘리트, HP 46)

```text
Use case: stylized-concept
Asset type: SLAY THE MONSTARZ Act 1 ELITE enemy master sprite — single isolated subject
Primary request: One original chibi dark-fantasy ELITE enemy, the Elite Sentinel, full body, strict side view facing LEFT, centered with generous padding on a flat solid #00ff00 background. A heavier, decorated Protoss-style war-sentinel: a larger hovering unit with reinforced symmetrical relic plating, dual energy lances, multiple orbiting shield shards, a bright central sensor eye. Clearly more elite and imposing than the basic floating scout, but still below boss scale.
Style/medium: hand-painted dark-fantasy 2D, thick dark contour, ancient gold-and-obsidian relic texture, tarnished gold with teal/cyan energy accents; no glossy sci-fi.
Constraints: original design, elite-tier silhouette (bigger than the basic sentinel), complete body and all shards inside frame with safe margins, crisp isolated edges, flat #00ff00 chroma everywhere. Do not use #00ff00 in the subject.
Avoid: franchise unit copies, glossy 3D, plastic surfaces, front-facing pose, cropped lances/shards, extra subjects, text, logo, watermark.
```
