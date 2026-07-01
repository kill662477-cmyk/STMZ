# 2·3막 전투 배경 v1 — 생성 프롬프트 (생성 대기)

- 상태: **프롬프트 완성, 생성 대기.** 현재 2·3막은 `stage_bg_act1.png`(1막 배경) 재사용 중.
- 출력: 16:9 가로 와이드, 1280×720(또는 1024² 안에 16:9 레터박스 후 중앙 크롭). 저장 `assets/review/backgrounds-v1/{id}_v1.png`.
- 승격: 승인분만 `assets/game/{id}.png` → `RunGame`/`BattleStage` 배경에서 막별로 분기 로드(현재 act1 고정 → act별 매핑 추가 필요한 코드 작업).
- 핵심 규칙: **중앙·하단 중앙을 비우고 어둡게** 유지(캐릭터 판독성). 디테일은 가장자리·원경으로. 캐릭터·생물·인물·UI·텍스트 없음.
- 기준: `assets/game/stage_bg_act1.png`와 동일 톤 계열(이어지는 한 세계).

---

## 1. stage_bg_act2 — 공명하는 심연 (The Resonating Abyss)

```text
WIDE CINEMATIC 16:9 HORIZONTAL PANORAMIC landscape background for a Slay-the-Spire-style turn-based battler stage. Theme: "The Resonating Abyss" — a dark resonant void-cavern battlefield deep underground/inside a derelict relic structure. A cracked obsidian-and-metal ground plane across the foreground where fighters stand; at the left and right edges, broken Protoss-style relic pillars and arches fused with abyssal Zerg growth and dripping organic matter; distant hazy silhouettes of vast resonant rings and a yawning magenta abyss in the deep background; floating dim resonance shards. HAND-PAINTED 2D illustration, Slay-the-Spire dark-fantasy tone: painterly brushwork, dark muted palette, dramatic dim lighting, gritty texture. Accent glow: cyan and violet resonance with deep magenta abyss light. IMPORTANT: keep the CENTER and LOWER-MIDDLE open, uncluttered and darker so characters read on top; push detail to edges and far background. No characters, no creatures, no figures, no UI, no text, no watermark, no color fringe.
```

## 2. stage_bg_act3 — 성간 끝 (The Interstellar End)

```text
WIDE CINEMATIC 16:9 HORIZONTAL PANORAMIC landscape background for a Slay-the-Spire-style turn-based battler stage. Theme: "The Interstellar End" — the battle-scarred upper deck / hull plating of a colossal gothic dreadnought drifting in a starless void. A riveted blackened-steel deck plane across the foreground; at the left and right edges, towering gothic capital-ship superstructure, broken antennae, and glowing furnace windows; in the deep background a starless void with distant dim fleet silhouettes and faint nebula haze. HAND-PAINTED 2D illustration, Slay-the-Spire dark-fantasy tone: painterly brushwork, dark muted palette, dramatic dim lighting, gritty texture. Accent glow: ember-red and white-hot reactor light with cool cyan-gold rim light. IMPORTANT: keep the CENTER and LOWER-MIDDLE open, uncluttered and darker so characters read on top; push detail to edges and far background. No characters, no creatures, no figures, no ships in the play area, no UI, no text, no watermark, no color fringe.
```
