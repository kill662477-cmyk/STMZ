# 3막 적 개별 마스터 v1 — 생성 프롬프트 (생성 대기)

- 상태: **프롬프트 완성, 생성 대기.** 선행: `assets/review/act3-enemy-concepts-v1/` 콘셉트 시트 생성·승인 후.
- 대상: `interceptor`(P), `fire_support`(T), `abyssal_cluster`(Z), `battleship_escort`(P 엘리트), `interstellar_battleship`(T 최종 보스). (battleContent에 적 정의는 이미 존재, 3막 연결은 FINAL_ACT 확장 시.)
- 출력: 각 1024² 이상(보스는 더 크게), 저장 `assets/review/act3-enemy-masters-v1/{id}_master_v1.png`. QA → 승인 → `assets/masters/{id}/` → 키포즈 보드.
- 테마: "성간 끝(The Interstellar End)". 2막보다 시각적으로 더 강하고 최종 단계다운 위압감.

공통 머리말(모든 프롬프트 적용):
> HAND-PAINTED 2D, Slay-the-Spire dark-fantasy tone: painterly brushwork, thick dark outlines, muted dark palette with luminous accents, dramatic side lighting, gritty texture. CHIBI shape language. STRICT SIDE VIEW facing LEFT. Full body, centered, generous safe padding, nothing touching the edge. Flat uniform solid #00ff00 chroma background. NOT glossy 3D, no clean modern spacecraft, no front view, no card frame, no UI, no text, no logo, no watermark, no color fringe.

---

## 1. interceptor — 정밀 요격기 (P 일반)

```text
Use case: stylized-concept
Asset type: SLAY THE MONSTARZ Act 3 enemy master sprite — single isolated subject
Primary request: One original chibi dark-fantasy enemy, the Precision Interceptor, full body, strict side view facing LEFT, centered with generous padding on a flat solid #00ff00 background. A sleek compact floating crescent hunter: twin forward phase blades, aged-gold and black relic armor, a single cyan targeting eye, hardened folding shield petals. Fast, predatory, elegant.
Style/medium: hand-painted dark-fantasy 2D, thick dark contour, ancient gold-obsidian relic texture, tarnished gold with cyan energy; no glossy sci-fi.
Constraints: original design, readable interceptor silhouette, complete body and blades inside frame with safe margins, crisp isolated edges, flat #00ff00 chroma. Do not use #00ff00 in the subject.
Avoid: franchise copies, glossy 3D, clean modern jet, front pose, cropped blades/petals, extra subjects, text, logo, watermark.
```

## 2. fire_support — 화력 지원선 (T 일반)

```text
Use case: stylized-concept
Asset type: SLAY THE MONSTARZ Act 3 enemy master sprite — single isolated subject
Primary request: One original chibi dark-fantasy enemy, the Fire Support Ship, full body, strict side view facing LEFT, centered with generous padding on a flat solid #00ff00 background. A hovering rusted heavy gunship: broad low hull, paired bombardment turrets, a glowing charged furnace reactor, industrial rivets and exhaust vents. Distinct from the wheeled Act 2 marauder — this one floats and is a gun platform.
Style/medium: hand-painted dark-fantasy 2D, thick dark contour, rough rusted-steel texture, charcoal and rust with ember-red and white-hot reactor light; no glossy sci-fi.
Constraints: original design, readable gunship silhouette, complete hull and turrets inside frame with safe margins, crisp isolated edges, flat #00ff00 chroma. Do not use #00ff00 in the subject.
Avoid: franchise copies, glossy 3D, clean modern spaceship, front pose, cropped turrets/hull, extra subjects, text, logo, watermark.
```

## 3. abyssal_cluster — 심연 군체 (Z 일반)

```text
Use case: stylized-concept
Asset type: SLAY THE MONSTARZ Act 3 enemy master sprite — single isolated subject
Primary request: One original chibi dark-fantasy enemy, the Abyssal Cluster, full body, strict side view facing LEFT, centered with generous padding on a flat solid #00ff00 background. One readable FUSED SWARM silhouette built from several small chitin organisms merged into a single mass: many short attacking limbs, corrosive spray sacs, regenerating overlapping carapace. Reads as one unit, not scattered creatures.
Style/medium: hand-painted dark-fantasy 2D, thick dark contour, rough wet organic texture, deep violet and black with acid-yellow biology; no glossy sci-fi.
Constraints: original design, ONE cohesive readable silhouette (not loose separate creatures), complete mass and limbs inside frame with safe margins, crisp isolated edges, flat #00ff00 chroma. Do not use #00ff00 in the subject.
Avoid: franchise copies, glossy 3D, multiple disconnected creatures reading as separate enemies, front pose, cropped limbs/sacs, text, logo, watermark.
```

## 4. battleship_escort — 전함 호위기 (P 엘리트)

```text
Use case: stylized-concept
Asset type: SLAY THE MONSTARZ Act 3 ELITE enemy master sprite — single isolated subject
Primary request: One original chibi dark-fantasy ELITE enemy, the Battleship Escort, full body, strict side view facing LEFT, centered with generous padding on a flat solid #00ff00 background. An imposing floating fortress escort: layered obsidian-and-gold shield plates, two articulated cannon arms, a reinforced prow, disciplined symmetrical silhouette. Clearly elite — heavier and grander than the Interceptor.
Style/medium: hand-painted dark-fantasy 2D, thick dark contour, obsidian-gold relic texture, deep black with tarnished gold and cyan energy; no glossy sci-fi.
Constraints: original design, elite-tier fortress silhouette, complete body, prow and both cannon arms inside frame with safe margins, crisp isolated edges, flat #00ff00 chroma. Do not use #00ff00 in the subject.
Avoid: franchise copies, glossy 3D, clean modern ship, front pose, cropped cannons/plates, extra subjects, text, logo, watermark.
```

## 5. interstellar_battleship — 성간 전함 (T 최종 보스)

```text
Use case: stylized-concept
Asset type: SLAY THE MONSTARZ Act 3 FINAL BOSS master sprite — single isolated subject
Primary request: One original chibi dark-fantasy FINAL BOSS, the Interstellar Battleship, full body, strict side view facing LEFT, centered with EXTRA-generous padding on a flat solid #00ff00 background. A colossal gothic dreadnought in chibi shape language: broad wedge hull, an enormous forward quantum cannon, stacked neutronium armor decks, glowing furnace windows, deep battle scars. Unmistakable final-boss mass — the largest, most intimidating enemy in the game.
Style/medium: hand-painted dark-fantasy 2D, thick dark contour, rough blackened-steel and neutronium texture, charcoal and rust with white-hot reactor light and ember-red accents; no glossy sci-fi. Final-boss-quality detail.
Constraints: original design, colossal boss silhouette, ENTIRE hull and forward cannon fully inside frame with wide safe margins (do not crop the cannon or hull), crisp isolated edges, flat #00ff00 chroma. Do not use #00ff00 in the subject.
Avoid: franchise copies, glossy 3D, clean modern battleship, front pose, cropped cannon/hull/decks, extra subjects, text, logo, watermark.
```
