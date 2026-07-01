# 캐릭터 전투 마스터 v1 — 생성 프롬프트 (활성 20명)

- 상태: 과거 제작 명세. `pado`와 `peanut`은 2026-07-01 게임에서 제외되어 활성 생성 대상이 아니다.
- 스타일 앵커: `assets/game/jdd_battle.png`(원본 `assets/masters/jdd/jdd_master.png`). **모든 캐릭터는 이 톤·완성도에 맞춘다.**
- 레퍼런스: `assets/refs/{file}`. **얼굴·헤어를 레퍼런스 인물로 즉시 인식되게 유지**(치비화해도 특징 보존). 실제 멤버 정체성이 최우선 — v1은 이걸 무시해 삭제됨.
- 입력 방식: 생성 시 해당 ref 이미지를 **입력 이미지(정체성 참조)**로 넣는다(img2img/reference). ref 없이 텍스트만으로 생성 금지.
- 출력: 각 1024² 이상, 저장 `assets/review/character-masters-v1/{id}_master_v1.png`. QA → 사용자 승인 → `assets/masters/{id}/` → 키포즈 보드(대기/공격/피격).
- 종족별 전투복 언어:
  - **P 프로토스**: 매끈한 에너지·고대 유물 갑주, 청록·금 발광 라인, 떠 있는 보호막 파편, 기사풍.
  - **T 테란**: 녹슨 중장 리벳 강철, 배기구, 거친 용병풍(= jdd 기준).
  - **Z 저그**: 유기질 키틴 장갑, 외골격 플레이트, 칙칙한 초록·보라 발광(인간 얼굴은 유지, 괴물화 금지).

공통 머리말(모든 캐릭터 적용):
> HAND-PAINTED 2D, Slay-the-Spire dark-fantasy tone: painterly brushwork, thick dark outlines, gritty texture, muted palette with a few saturated accents, dramatic side lighting. CHIBI proportions (large head, small body). STRICT SIDE VIEW, the character faces the RIGHT side of the image (player faces right toward off-screen enemies), three-quarter-back side angle like a side-on RPG battler — NOT frontal. Full body head-to-toe, centered, generous safe padding, nothing touching the edge. Flat uniform solid #00ff00 chroma background. **Preserve the facial identity and hairstyle from the input reference image so the real member stays recognizable in profile.** Subtly weave in MONSTARZ team cues (a small jersey number and a tiny team emblem on the armor, navy-and-white accents) WITHOUT an actual baseball jersey. Standing battle-ready idle, weapon/hands ready. NOT glossy 3D, no front view, no card frame, no UI, no text, no logo, no watermark, no color fringe.

---

## 완료
- `jdd` 지두두 (T, 여성) — `assets/game/jdd_battle.png` 승인 앵커. (ref `23_jdd.png`)

## 종족 확정 — 생성 준비됨

### hyeonje — 변현제 (P), ref `mini.webp`
```text
STRICT SIDE VIEW facing RIGHT, chibi full-body battle master for SLAY THE MONSTARZ. Preserve the facial identity and hairstyle of the person in the input reference (mini.webp) so 변현제 is recognizable in profile. Reimagine as a Protoss-style (P) energy-knight fighter: sleek ancient-relic armor with smooth symmetrical plating, glowing teal-and-gold energy lines, a couple of small floating shield shards, holding an original energy blade or focus weapon; regal, composed, protective stance. Chibi proportions, hand-painted dark-fantasy 2D, thick dark outlines. Subtle MONSTARZ number + tiny emblem and navy-white accents, NO baseball jersey. Full body, centered, generous padding, flat solid #00ff00 background. No front view, no face copy of any other person, no text, no logo, no watermark.
```

### soulkey — 김민철 (Z), ref `soulkey.jpg`
```text
STRICT SIDE VIEW facing RIGHT, chibi full-body battle master for SLAY THE MONSTARZ. Preserve the facial identity and hairstyle of the person in the input reference (soulkey.jpg) so 김민철 is recognizable in profile — keep him fully HUMAN, do not turn him into a monster. Reimagine as a Zerg-style (Z) bio-armored fighter: organic chitin plate armor over the body, subtle exoskeletal ridges, sickly green-and-purple bioluminescent accents, an original bone-or-claw weapon; menacing but grounded human fighter stance. Chibi proportions, hand-painted dark-fantasy 2D, thick dark outlines. Subtle MONSTARZ number + tiny emblem and navy-white accents, NO baseball jersey. Full body, centered, generous padding, flat solid #00ff00 background. No front view, monstrous face replacement forbidden, no text, no logo, no watermark.
```

## 종족 확정 19명 — 생성 준비 완료 (2026-06-28 사용자 배정)

각 프롬프트 앞에 위 "공통 머리말"을 적용한다. 생성 시 해당 ref를 입력 이미지로 넣고 얼굴·헤어를 보존한다. id는 코드용 영문 슬러그(확정 필요 시 사용자 조정).

### 저그(Z) — 인간 얼굴 유지, 괴물화 금지

#### calm — ref `01_calm.png`
```text
STRICT SIDE VIEW facing RIGHT, chibi full-body battle master for SLAY THE MONSTARZ. Preserve the facial identity and hairstyle of the person in the input reference (01_calm.png), recognizable in profile, fully HUMAN. Reimagine as a Zerg-style (Z) bio-armored fighter: organic chitin plate armor, subtle exoskeletal ridges, sickly green-and-purple bioluminescent accents, an original bone-or-claw weapon, menacing grounded human stance. Subtle MONSTARZ number + tiny emblem, navy-white accents, NO baseball jersey. Full body centered, generous padding, flat solid #00ff00 background. No front view, no monster face replacement, no text, no logo, no watermark.
```
#### killer — ref `05_killer.png`
```text
STRICT SIDE VIEW facing RIGHT, chibi full-body battle master. Preserve facial identity and hairstyle from input reference (05_killer.png), recognizable in profile, fully HUMAN. Zerg-style (Z) bio-armored fighter: organic chitin plates, exoskeletal ridges, sickly green-purple bioluminescent accents, original bone/claw weapon, aggressive grounded stance. Subtle MONSTARZ number + emblem, navy-white accents, NO jersey. Full body centered, padding, flat #00ff00 bg. No front view, no monster face, no text/logo/watermark.
```
#### hm — ref `07_hm.png`
```text
STRICT SIDE VIEW facing RIGHT, chibi full-body battle master. Preserve facial identity and hairstyle from input reference (07_hm.png), recognizable in profile, fully HUMAN. Zerg-style (Z) bio-armored fighter: organic chitin plates, exoskeletal ridges, sickly green-purple bioluminescent accents, original bone/claw weapon, grounded stance. Subtle MONSTARZ number + emblem, navy-white accents, NO jersey. Full body centered, padding, flat #00ff00 bg. No front view, no monster face, no text/logo/watermark.
```
#### seventytwo — ref `16_72.png`
```text
STRICT SIDE VIEW facing RIGHT, chibi full-body battle master. Preserve facial identity and hairstyle from input reference (16_72.png), recognizable in profile, fully HUMAN. Zerg-style (Z) bio-armored fighter: organic chitin plates, exoskeletal ridges, sickly green-purple bioluminescent accents, original bone/claw weapon, grounded stance. Subtle MONSTARZ number + emblem, navy-white accents, NO jersey. Full body centered, padding, flat #00ff00 bg. No front view, no monster face, no text/logo/watermark.
```
#### zoe — ref `17_zoe.png`
```text
STRICT SIDE VIEW facing RIGHT, chibi full-body battle master. Preserve facial identity and hairstyle from input reference (17_zoe.png), recognizable in profile, fully HUMAN. Zerg-style (Z) bio-armored fighter: organic chitin plates, exoskeletal ridges, sickly green-purple bioluminescent accents, original bone/claw weapon, grounded stance. Subtle MONSTARZ number + emblem, navy-white accents, NO jersey. Full body centered, padding, flat #00ff00 bg. No front view, no monster face, no text/logo/watermark.
```
#### bright — ref `19_bright.png`
```text
STRICT SIDE VIEW facing RIGHT, chibi full-body battle master. Preserve facial identity and hairstyle from input reference (19_bright.png), recognizable in profile, fully HUMAN. Zerg-style (Z) bio-armored fighter: organic chitin plates, exoskeletal ridges, sickly green-purple bioluminescent accents, original bone/claw weapon, grounded stance. Subtle MONSTARZ number + emblem, navy-white accents, NO jersey. Full body centered, padding, flat #00ff00 bg. No front view, no monster face, no text/logo/watermark.
```
#### jji — ref `24_jji.png`
```text
STRICT SIDE VIEW facing RIGHT, chibi full-body battle master. Preserve facial identity and hairstyle from input reference (24_jji.png), recognizable in profile, fully HUMAN. Zerg-style (Z) bio-armored fighter: organic chitin plates, exoskeletal ridges, sickly green-purple bioluminescent accents, original bone/claw weapon, grounded stance. Subtle MONSTARZ number + emblem, navy-white accents, NO jersey. Full body centered, padding, flat #00ff00 bg. No front view, no monster face, no text/logo/watermark.
```
#### nangni — ref `26_nangni.png`
```text
STRICT SIDE VIEW facing RIGHT, chibi full-body battle master. Preserve facial identity and hairstyle from input reference (26_nangni.png), recognizable in profile, fully HUMAN. Zerg-style (Z) bio-armored fighter: organic chitin plates, exoskeletal ridges, sickly green-purple bioluminescent accents, original bone/claw weapon, grounded stance. Subtle MONSTARZ number + emblem, navy-white accents, NO jersey. Full body centered, padding, flat #00ff00 bg. No front view, no monster face, no text/logo/watermark.
```

### 프로토스(P)

#### tyson — ref `06_tyson.png`
```text
STRICT SIDE VIEW facing RIGHT, chibi full-body battle master. Preserve facial identity and hairstyle from input reference (06_tyson.png), recognizable in profile. Protoss-style (P) energy-knight fighter: sleek ancient-relic armor with smooth symmetrical plating, teal-and-gold glowing energy lines, a few small floating shield shards, original energy blade or focus weapon, regal composed stance. Subtle MONSTARZ number + emblem, navy-white accents, NO jersey. Full body centered, padding, flat #00ff00 bg. No front view, no text/logo/watermark.
```
#### chu — ref `11_chu.png`
```text
STRICT SIDE VIEW facing RIGHT, chibi full-body battle master. Preserve facial identity and hairstyle from input reference (11_chu.png), recognizable in profile. Protoss-style (P) energy-knight fighter: sleek ancient-relic armor, teal-and-gold glowing energy lines, small floating shield shards, original energy blade/focus weapon, regal stance. Subtle MONSTARZ number + emblem, navy-white accents, NO jersey. Full body centered, padding, flat #00ff00 bg. No front view, no text/logo/watermark.
```
#### rang — ref `14_rang.png`
```text
STRICT SIDE VIEW facing RIGHT, chibi full-body battle master. Preserve facial identity and hairstyle from input reference (14_rang.png), recognizable in profile. Protoss-style (P) energy-knight fighter: sleek ancient-relic armor, teal-and-gold glowing energy lines, small floating shield shards, original energy blade/focus weapon, regal stance. Subtle MONSTARZ number + emblem, navy-white accents, NO jersey. Full body centered, padding, flat #00ff00 bg. No front view, no text/logo/watermark.
```
#### song — ref `22_song.png`
```text
STRICT SIDE VIEW facing RIGHT, chibi full-body battle master. Preserve facial identity and hairstyle from input reference (22_song.png), recognizable in profile. Protoss-style (P) energy-knight fighter: sleek ancient-relic armor, teal-and-gold glowing energy lines, small floating shield shards, original energy blade/focus weapon, regal stance. Subtle MONSTARZ number + emblem, navy-white accents, NO jersey. Full body centered, padding, flat #00ff00 bg. No front view, no text/logo/watermark.
```
### 테란(T) — jdd 앵커와 동일 계열

#### chamchi — ref `08_chamchi.png`
```text
STRICT SIDE VIEW facing RIGHT, chibi full-body battle master. Preserve facial identity and hairstyle from input reference (08_chamchi.png), recognizable in profile. Terran-style (T) industrial fighter: rusty heavy riveted steel plate armor, exhaust vents, worn utilitarian metal, holding an original chunky sci-fi firearm, gritty mercenary stance. Subtle MONSTARZ number + emblem, navy-white accents, NO jersey. Full body centered, padding, flat #00ff00 bg. No front view, no text/logo/watermark.
```
#### sun — ref `12_sun.png`
```text
STRICT SIDE VIEW facing RIGHT, chibi full-body battle master. Preserve facial identity and hairstyle from input reference (12_sun.png), recognizable in profile. Terran-style (T) industrial fighter: rusty heavy riveted steel armor, exhaust vents, original chunky sci-fi firearm, gritty mercenary stance. Subtle MONSTARZ number + emblem, navy-white accents, NO jersey. Full body centered, padding, flat #00ff00 bg. No front view, no text/logo/watermark.
```
#### sample — ref `15_sample.png`
```text
STRICT SIDE VIEW facing RIGHT, chibi full-body battle master. Preserve facial identity and hairstyle from input reference (15_sample.png), recognizable in profile. Terran-style (T) industrial fighter: rusty heavy riveted steel armor, exhaust vents, original chunky sci-fi firearm, gritty mercenary stance. Subtle MONSTARZ number + emblem, navy-white accents, NO jersey. Full body centered, padding, flat #00ff00 bg. No front view, no text/logo/watermark.
```
#### ample — ref `25_ample.png`
```text
STRICT SIDE VIEW facing RIGHT, chibi full-body battle master. Preserve facial identity and hairstyle from input reference (25_ample.png), recognizable in profile. Terran-style (T) industrial fighter: rusty heavy riveted steel armor, exhaust vents, original chunky sci-fi firearm, gritty mercenary stance. Subtle MONSTARZ number + emblem, navy-white accents, NO jersey. Full body centered, padding, flat #00ff00 bg. No front view, no text/logo/watermark.
```
#### fivehundred — ref `18_500.png`
```text
STRICT SIDE VIEW facing RIGHT, chibi full-body battle master. Preserve facial identity and hairstyle from input reference (18_500.png), recognizable in profile. Terran-style (T) industrial fighter: rusty heavy riveted steel armor, exhaust vents, original chunky sci-fi firearm, gritty mercenary stance. Subtle MONSTARZ number + emblem, navy-white accents, NO jersey. Full body centered, padding, flat #00ff00 bg. No front view, no text/logo/watermark.
```

## 최종 종족 로스터 (20명)

- **Z (9)**: 김민철(soulkey), calm, killer, hm, 72, zoe, bright, jji, nangni
- **P (5)**: 변현제(mini), tyson, chu, rang, song
- **T (6)**: 지두두(jdd, 완료), chamchi, sun, sample, ample, 500

## 2차 자산 (캐릭터당, 마스터 승인 후)
- **카드 선택용 정면 초상**(§12 캐릭터 선택 화면): 동일 인물·종족복, **정면(front)** 반신, 카드 톤. 별도 생성.
- **키포즈 보드**: 대기2/공격3/피격1, `enemy-motion-gpt-board-v1` 형식, 마스터를 입력으로.
