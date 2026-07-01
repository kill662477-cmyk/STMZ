# 이미지 생성 큐 — SLAY THE MONSTARZ

## 2026-06-30 Codex 진행

- 전투 마스터 실제 수량을 **37종(캐릭터 22 + 적 15)**으로 정정했다.
  이전의 "적 16 / 총 38" 표기는 목록 합계와 맞지 않았다.
- `assets/review/master-cutouts-v1/`: 37종 모두 1024×1024 RGBA 컷아웃,
  안전 여백 24px·테두리 접촉 0으로 자동 QA PASS. 아직 라이브 승격 안 함.
- 원본 결함 4종(`soulkey`, `fire_support`, `abyssal_cluster`,
  `elite_sentinel`)은 `assets/review/master-repairs-v1/`에 보정 후보 생성.
  승인 마스터 원본은 덮어쓰지 않음.
- 1막 키포즈 파일럿:
  `wasteland_gunner`, `acid_stalker`는 6포즈 처리 QA PASS,
  `elite_sentinel`은 처리 QA PASS이나 포즈별 방패 조각 수 변화로 조건부 검토.
  상세: `assets/review/enemy-motion-v2/README.md`.
- `tools/keypose_board.py`에 올리브 크로마 대응용 알파 컷오프·노이즈 제거,
  작은 테두리 성분 제거, 고신뢰 전경 제한, 그리드 맞춤, 프레임별 좌우 반전 옵션 추가.
- 라이브 에셋·`texture` 매핑·외부 배포 변경 없음.

## ✅ 생성 완료 (2026-06-29) — 게임 원화 전부 생성·승인됨
- **카드 16** → `assets/game/cards/` (라이브, cardArtUrl 자동연동)
- **캐릭터 마스터 22**(jdd+21) → `assets/masters/{id}/{id}_master.png` (승인 승격)
- **적 마스터 16**(sentinel_scout·brood_queen 기존 + 신규 13: 1막 wasteland_gunner·acid_stalker·elite_sentinel / 2막 void_stalker·siege_marauder·chitin_brute·resonance_warden·abyssal_charger / 3막 interceptor·fire_support·abyssal_cluster·battleship_escort·interstellar_battleship) → `assets/masters/{id}/` (승인 승격)
- **배경 3**(act1·2·3) → `assets/game/stage_bg_act{1,2,3}.png` (라이브)
- 생성 도구: `tools/gen_images.py` + `tools/*_prompts.json`(card/character/act1·2·3_enemy/background). Gemini `gemini-2.5-flash-image`, 키 `.env.local` GEMINI_API_KEY(결제 활성).

## ⏳ 남은 이미지 작업 (OpenCode 코드 트랙)
1. **마스터 → 투명 스프라이트**: 녹색 크로마 제거. 주의: 배경 초록이 약간 올리브빛(순수 #00ff00 아님) → `keypose_board.py` 크로마 허용범위 넓히기.
2. **키포즈 보드**(캐릭터 22·적 16): 대기/공격/피격 → `BattleStage` AnimatedSprite. 형식 `assets/review/enemy-motion-gpt-board-v1`.
3. **texture 키 교체**: 신규 적(scout/queen 공유 중)·신규 캐릭터(jdd 공유) → 전용. `battleContent.texture`·`BattleStage ENEMY_MOTION`.
4. (선택) 캐릭터 정면 초상(캐릭터 선택 화면), 포션/유물 아이콘.

---
(이하 원본 큐 — 프롬프트 위치·파이프라인 참고용)

작성 2026-06-28 (Claude). **모든 필요한 프롬프트가 작성 완료된 상태.** 생성기만 있으면 순서대로 뽑으면 된다.

## 생성기 옵션

- **코덱스 내장 `imagegen`** (콘셉트 시트를 만든 그 도구) — 가장 간단.
- 또는 `.env.local`에 `GEMINI_API_KEY`(Nano Banana) 또는 `OPENAI_API_KEY`(GPT Image)를 넣으면 Claude가 `tools/gen_images.py`를 작성해 직접 생성 가능.
- **AetherForge는 사용하지 않는다**(GAME_DESIGN §13).

## 공통 파이프라인 (자산별)

1. 프롬프트로 후보 생성 → `assets/review/<batch>/{id}_v1.png`.
2. QA: 전신·셀/프레임 경계 비접촉·평면 #00ff00 크로마·화풍 일치·텍스트/로고 없음.
3. **사용자 승인** 후에만 승격.
4. 마스터 승격 → `assets/masters/{id}/`, 게임 적용은 `assets/game/`.
5. 적 마스터는 승격 후 **키포즈 보드**(아래 2단계)로 진행.

## 큐 (우선순위 순)

| # | 배치 | 개수 | 프롬프트 위치 | 출력 → 승격 | 비고 |
|---|---|---|---|---|---|
| 1 | 카드 아트 | 16 | `tools/card_art_prompts.json` | `assets/review/cards/{id}-v1.png` → `assets/game/cards/{id}.png` | 강화본 id+는 기본 재사용. strike는 앵커(이미 프롬프트 확정) |
| 2 | 1막 적 전용 마스터 | 3 | `assets/review/act1-enemy-masters-v1/PROMPT.md` | → `assets/masters/{id}/` | wasteland_gunner·acid_stalker·elite_sentinel (현재 scout 텍스처 공유 중) |
| 3 | 2막 적 마스터 | 5 | `assets/review/act2-enemy-masters-v1/PROMPT.md` | → `assets/masters/{id}/` | 콘셉트 시트 승인 후. void_stalker·siege_marauder·chitin_brute·resonance_warden·abyssal_charger |
| 4 | 배경 (2·3막) | 2 | `assets/review/backgrounds-v1/PROMPT.md` | → `assets/game/stage_bg_act2.png`, `stage_bg_act3.png` | 16:9, 중앙 비움 |
| 5 | 3막 적 콘셉트 시트 | 1 | `assets/review/act3-enemy-concepts-v1/PROMPT.md` | 리뷰용 (승격 X) | 코덱스가 PROMPT만 작성, PNG 미생성(여기서 멈춤) |
| 6 | 3막 적 마스터 | 5 | `assets/review/act3-enemy-masters-v1/PROMPT.md` | → `assets/masters/{id}/` | 콘셉트 승인 후. interceptor·fire_support·abyssal_cluster·battleship_escort·interstellar_battleship |
| 7 | 캐릭터 전투 마스터 (종족 전원 확정) | 21 | `assets/review/character-masters-v1/PROMPT.md` | → `assets/masters/{id}/` | jdd 제외 21명 전부 프롬프트 완성. ref 입력 필수, 얼굴·헤어 보존. Z9/P7/T6 로스터는 프롬프트 파일 하단 표 참고 |

이미 완료(참고): 2막 적 콘셉트 시트(`act2-enemy-concepts-v1/`, 리뷰 대기), jdd 캐릭터 마스터+모션, sentinel_scout·brood_queen 마스터+키포즈 보드, stage_bg_act1.

> 캐릭터 2차 자산: 마스터 승인 후 캐릭터당 ① 카드 선택용 정면 초상 ② 키포즈 보드 추가 생성.

## 2단계 — 키포즈 보드 (각 적 마스터 승인 후)

마스터가 승인되면 적별로 6포즈 보드를 생성한다. 프롬프트 형식·셀 규칙은 `assets/review/enemy-motion-gpt-board-v1/PROMPTS.md` 참고(일반 적 3×2: 대기2/공격3/피격1, 보스 2×3). 처리·QA는 `tools/keypose_board.py`. 이 단계 프롬프트는 마스터 확정 후 마스터를 입력 이미지로 삼아 작성한다(미리 작성하지 않음).

## 코드 연동(이미지 승격 후 OpenCode/Claude가 처리)

- 1막 적 3종: `battleContent.ts`의 `texture`와 `BattleStage`의 `ENEMY_MOTION` 매핑을 신규 키로 교체(현재 scout 공유 → 전용).
- 2·3막 적: 동일하게 전용 텍스처 키 연결.
- 배경: 막별 배경 로드 분기 추가(현재 act1 고정).
- 카드: `cardArtUrl`이 `assets/game/cards/{id}.png` 자동 탐지(코드 변경 불필요, 파일만 넣으면 적용).
