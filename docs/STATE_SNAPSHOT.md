# 상태 스냅샷 — 2026-06-29 (Claude 기록, 개발 안 함)

## 2026-07-01 Codex 체크포인트 — 10층 지도·기존 적 2체전

- 전 막을 10층으로 확장했다:
  1·2 전투 / 3 이벤트 / 4 2체전 / 5 상점+엘리트 / 6 2체전 /
  7 보물 / 8 2체전 / 9 휴식 / 10 보스.
- 2체전은 각 막의 기존 일반 적만 조합하며 신규 이미지가 필요 없다.
- 전투 엔진·Pixi 스테이지·HUD가 적 두 체의 개별 상태·의도·행동·연출을 지원한다.
- 기존 `f1`~`f7` 저장 노드 의미를 보존하고 `f3b`·`f4b`·`f5b`만 삽입했다.
- 실제 브라우저에서 10층 지도, 적 2체 표시와 두 적의 연속 행동을 확인했다.
- typecheck, 10파일 116테스트, production build PASS. 콘솔 오류·경고 0.
- 이후 신규 이미지는 `docs/IMAGE_REQUESTS.md`에 외부 제작 사양만 기록한다.

## 2026-07-01 Codex 체크포인트 — 카드 아트 60종 적용 완료

- `abc/*.png` 60종을 공용 40종·시그니처 20종과 ID 대조 후
  `assets/game/cards/`에 라이브 적용했다.
- 15종의 밝은 외곽선을 크롭했고, Rang과 72 시그니처의 반대 종족 테마
  연결을 바로잡았다.
- 최종 QA: 60/60 1024×1024 불투명 RGB, 누락·초과·중복 0,
  라이브 해시 60/60 일치.
- 리뷰: `assets/review/cards-abc-v1/`.
- 백업: `assets/game/cards-backup/20260701-110102/`.
- 실제 전투에서 일반 손패 및 Rang·72 시그니처 렌더링 확인 완료.
- py_compile, typecheck, 112테스트, production build PASS.
- 외부 배포 없음.

## 2026-06-30 Codex 중단 체크포인트 — 사용자 요청으로 여기서 정지

### 이번 세션 완료

1. **섬광탄 카드 아트**
   - `tools/card_art_prompts.json`에 `flash_bang` 프롬프트 추가.
   - Gemini 후보: `assets/review/cards/flash_bang-v1.png`.
   - 라이브 적용: `assets/game/cards/flash_bang.png`.
   - 프로덕션 빌드에서 `flash_bang-*.png` 번들 포함 확인.

2. **휴식 카드 강화 화면**
   - `src/ui/RunGame.tsx`: 강화 가능 카드를 페이지당 9장으로 분할.
   - 3열 × 3행 그리드, 이전/다음 페이지 버튼, 현재 페이지·범위 표시 추가.
   - 브라우저 픽스처 검증: 17종 기준 1페이지 9장 / 2페이지 8장 전환 확인.

3. **카드 이미지 여백 최적화**
   - `tools/optimize_card_art.py` 추가.
   - 흰 캔버스 여백이 있던 8종 최적화·라이브 교체:
     `aimedshot`, `empower`, `flurry`, `guard`, `pin`, `quickshot`,
     `shieldwall`, `strike`.
   - 교체 전 백업:
     `assets/game-backup/20260630-065622/cards/`.
   - 리뷰 후보: `assets/review/cards-optimized-v1/`.

4. **상점 세로 스크롤**
   - `src/style.css`: `.shop-shell`과 `.rest-shell`을 `100dvh` 독립 스크롤
     컨테이너로 변경.
   - 브라우저 검증: 상점 `clientHeight=720`, `scrollHeight=1323`,
     `overflow-y=auto`.

5. **검증 기준선 복구**
   - `src/game/run/RunEngine.test.ts:183`의 TypeScript 제어흐름 오류 수정.
   - `package.json`의 잘못된 Linux 전용 Rollup 직접 의존성 제거 후
     `npm install`로 Windows 네이티브 Rollup 복구.
   - `npm.cmd run typecheck`: PASS.
   - `npm.cmd run build`: PASS.
   - `npm.cmd run test`: **103/104 PASS**.
     남은 1건은 `actOneFullRun.test.ts:239`의 기존 QA 계측 문제:
     1막 보스 이후 막 전환으로 `completedNodeIds`가 초기화되어 승리 런을
     `floorsCleared=0`으로 읽는다. 전투 데드락/패배가 아니라 테스트 집계 오류.

### 이번 세션 이전에 완료된 이미지 진행

- `assets/review/master-cutouts-v1/`: 실제 마스터 37종
  (캐릭터 22 + 적 15) 1024×1024 RGBA, 자동 QA 37/37 PASS.
- `assets/review/enemy-motion-v2/`: 1막 적 3종 키포즈 처리 QA PASS.
  `wasteland_gunner`, `acid_stalker`는 승인 검토 가능.
  `elite_sentinel`은 포즈별 방패 조각 수 변화로 조건부.
- 라이브 캐릭터/적 텍스처 매핑은 아직 교체하지 않음.

### 2026-06-30 캐릭터 방향·시선 교정 완료

1. `ample`: 정면 얼굴을 우측 전투 방향 3/4 프로필과 우측 시선으로 교정.
2. `bright`, `fivehundred`, `jji`, `sample`: 카메라 쪽으로 쏠린 동공을
   머리·무기 방향과 같은 화면 우측 시선으로 교정.
3. 원본/후보 비교판:
   `assets/review/character-gaze-fix-v1/comparison_full_v1.png`,
   `assets/review/character-gaze-fix-v1/comparison_faces_v1.png`.
4. 최종 후보를 원본 마스터 규격 `864×1184`로 정규화해 5개 마스터에 승격.
   교체 전 백업:
   `assets/masters-backup/20260630-112551/`.
5. 갱신된 투명 컷아웃:
   `assets/review/master-cutouts-v1/{ample,bright,fivehundred,jji,sample}/`.
   5/5 자동 QA PASS, 안전 여백 24px 이상, 가장자리 접촉 0.

### 2026-06-30 2막 적 키포즈 배치 완료

1. 프롬프트 명세:
   `tools/act2_enemy_keypose_prompts.json`.
2. 리뷰 산출물:
   `assets/review/act2-enemy-motion-v1/`.
3. 5종 모두 2열 × 3행, 6포즈
   (`idle_low`, `idle_high`, `windup`, `release`, `recovery`, `hit`) 제작:
   `void_stalker`, `siege_marauder`, `chitin_brute`,
   `resonance_warden`, `abyssal_charger`.
4. `void_stalker`는 release 포즈의 공명 링 누락을 v2에서 보수.
   `abyssal_charger`는 hit 포즈의 쌍엄니 누락을 v2에서 보수.
5. 선택된 30프레임 모두 `384×480` RGBA 정규화,
   안전 여백 12px 이상, 가장자리 접촉 0으로 자동 QA PASS.
6. 아직 라이브 텍스처 매핑은 교체하지 않음.

### 아직 하지 않은 것

- 라이브 캐릭터/적 스프라이트 연동.
- 외부 배포·Supabase·AetherForge.

OpenCode 진행 현황을 파악해 저장만 한 것. 코드 수정 없음.

## ⚠️ 현재 빌드 깨짐 (2건 — 먼저 수리 필요)
1. **typecheck/build FAIL**: `src/game/run/RunEngine.test.ts:183` — `TS2367` (`run.completeBattle()` 호출 뒤 `run.state.phase === "reward"` 비교가 타입상 불가로 좁혀짐). `completeBattle` 후 phase를 재확인하려면 지역 변수로 캡처하거나 타입 단언 필요. OpenCode 작업 중으로 추정.
2. **vitest 실행 불가**: `node_modules/rollup/dist/native.js` MODULE_NOT_FOUND (rollup Windows 선택 의존성 npm 버그, HANDOFF §21에서 한 번 복구했던 이슈 재발). → `npm install`(또는 rollup 재설치)로 복구.

→ 위 2건 수리 후 `npm.cmd run typecheck/test/build` 재확인 필요.

## OpenCode가 진행한 것 (코드)
- **캐릭터**: 활성 20명 정의(`battleContent.characters`, T6·P5·Z9, race·maxHp·종족 시작덱·startingRelic·signatureCard) + 캐릭터 선택 화면 + `createRun(characterId)`.
- **종족 카드풀**: `actOne.ts`에 `P_POOL` 등 종족 풀 추가(보상/상점 종족별 분리 진행 흔적).
- **상태이상 6종**: `StatusKind = vulnerable | weak | strength | poison | regen | stun` (중독·재생·기절 추가됨).
- **콘텐츠 확충**: 포션 5(화염병·활력주사·철벽혈청·생명력물약·명상물약), 유물 10, 이벤트 11.
- **막**: 1·2·3막 + 난이도 튜닝(이전 세션 §34까지).
- **이미지**: 원화 전부 생성·승격 — 카드 16(`assets/game/cards/`), 캐릭터 마스터 22 + 적 마스터 16(`assets/masters/{id}/`), 배경 3(`assets/game/stage_bg_act{1,2,3}.png`). 생성도구 `tools/gen_images.py` + 프롬프트 JSON들.
- 테스트 파일: battleContent/BattleEngine/RunEngine/runBattle/runPersistence/deckView/actTwo/actThree/actOneFullRun/actTwoFullRun.

## 아직 안 된 것 (코드) — 상세 백로그는 `docs/HANDOFF_OPENCODE.md`
- 카드 유형 `CardType`은 아직 `attack | skill`만(파워·저주·중립 미구현).
- 시그니처 카드(캐릭터별 고유) 없음.
- **캐릭터 스프라이트 미연동**: 전원 `texture:"jdd"` 공유. 신규 적도 `scout`/`queen` 공유. → 마스터 크로마 제거→키포즈→texture 교체 필요(이미지는 준비됨).
- **막별 배경 미연동**: act2/act3 bg 파일은 있으나 코드가 `stage_bg_act1.png`만 import(`BattleStage.ts`·`RunGame.tsx`).
- 설정·일시정지 화면, 오디오, 접근성(로컬라이즈·게임패드·색맹), 배포 — 미착수.

## 다음(권장)
OpenCode가 ①rollup 재설치 ②RunEngine.test.ts:183 타입 에러 수정으로 빌드 복구 → 이후 `HANDOFF_OPENCODE.md` 트랙 순서대로.

## 2026-06-30 라이브 스프라이트 연동 완료

- 캐릭터 22종을 `assets/game/characters/`의 개별 텍스처로 연결했다.
  `jdd`는 기존 25프레임 모션을 유지하고, 나머지 21종은 정적 전용 컷아웃과 종족별 절차형 공격 이펙트를 사용한다.
- 적 15종을 `assets/game/enemy-motion/`으로 분리했다.
  1·2막은 전용 6포즈 시트, 3막은 전용 정적 컷아웃과 절차형 공격 모션을 사용한다.
- `battleContent`의 모든 캐릭터·적 texture ID는 각 엔티티 ID와 일치한다.
- 검증: typecheck PASS, test 106/106 PASS, build PASS, 적 시트 규격 15/15 PASS.
- 인앱 브라우저 세션 연결 오류로 자동 시각 검수는 못 했으므로 실제 화면의 크기·기준선 확인이 다음 게이트다.
- 외부 배포·Supabase·신규 Aether 생성 없음.

## 2026-06-30 전투 비주얼 QA 후속 완료

- 인앱 브라우저 연결을 복구해 실제 1막 전투 및 1·2·3막 대표 조합을 확인했다.
- DEV 전용 `?combatQa=1` 전투 갤러리를 추가했다.
- 2막 적 시트 스케일, 2막 보스, 3막 가로형 함선과 최종 보스 크기·피격 높이를 보정했다.
- 공격 모션 재생 후 콘솔 오류 0.
- `tools/act3_enemy_keypose_prompts.json`에 3막 적 5종의 6포즈 제작 명세를 작성하고 참조 마스터 5/5를 확인했다.
- typecheck, 106/106 테스트, build, `keypose_board.py` py_compile PASS.
- 실제 3막 보드 생성·라이브 승격·외부 배포는 하지 않았다.

## 2026-06-30 시선 수정 캐릭터 라이브 재승격

- `ample`, `bright`, `fivehundred`, `jji`, `sample` 라이브 파일이 수정 전
  `{id}_cutout_sheet.png`를 가리키던 문제를 확인했다.
- 수정 후 `{id}_sheet.png`를 라이브로 교체했고, SHA-256 5/5 일치를 확인했다.
- 이전 라이브 파일 백업: `assets/game/characters-backup/20260630-162250/`.
- 5개 모두 1024×1024 RGBA, 알파 가장자리 접촉 0.

## 2026-06-30 3막 적 6포즈 리뷰 시트 완료

- 리뷰 경로: `assets/review/act3-enemy-motion-v1/`.
- 선택본: `interceptor` v2, `fire_support` v1, `abyssal_cluster` v2,
  `battleship_escort` v1, `interstellar_battleship` v1.
- 선택본 30/30프레임 자동 QA 및 육안 QA PASS.
- 모든 프레임은 `384×480` RGBA, 12px 안전 여백 이상, 가장자리 접촉 0.
- 기존 정적 파일은
  `assets/game/enemy-motion-backup/20260630-172623/`에 백업했다.
- 선택본 5개를 라이브 승격하고 `BattleStage.ts`에 2×3 6포즈로 연결했다.
- typecheck·106테스트·production build PASS.
- 다음 작업은 `?combatQa=1`에서 3막 5종의 실제 크기·기준선·포즈 전환 확인이다.

## 2026-06-30 3막 적 라이브 화면 QA 완료

- `?combatQa=1`에서 3막 적 5종의 대기·공격을 실제 재생했다.
- 원거리 투사체, 심연 군집체 근접 돌진, 피격 높이와 피해 숫자가 정상이다.
- 잘림·기준선 이탈·셀 혼입 없음. 추가 코드 수정 없음.
- 3막 적 6포즈 제작·승격·화면 QA 트랙은 완료됐다.

## 2026-06-30 전투 방향·종족 공격 후속 수정

- 지두두 idle은 첫 프레임 고정, 공격 25프레임은 유지.
- P/Z 정적 캐릭터는 전진 칼질과 종족색 참격 호를 사용한다.
- 잔해 총잡이는 런타임 반전으로 왼쪽을 바라본다.
- typecheck·106테스트·build·실제 화면 QA PASS, 브라우저 오류 0.

## 2026-06-30 잔해 총잡이 실제 좌향 시트 교체

- 런타임 반전은 방향 판독이 부족해 폐기했다.
- `assets/review/enemy-motion-v3/`에서 실제 좌향 6포즈를 제작·검수했다.
- 라이브 교체 및 백업 `assets/game/enemy-motion-backup/20260630-213549/`.
- `flipX` 제거, 실제 실루엣 높이 361 적용.
- 6/6프레임 QA, 화면 대기·공격, typecheck·106테스트·build PASS.

## 2026-06-30 캐릭터 22종 시그니처 카드 완료

- `src/content/signatureCards.ts`에 캐릭터별 고유 카드 22장을 추가했다.
- 모든 시작 덱은 10장을 유지하며 `strike` 1장이 고유 카드로 교체된다.
- 종족 공용 드래프트 풀과 분리하고 강화·덱 보기·전투·휴식 UI에 연결했다.
- 기존 버전 1 저장도 불러올 때 시그니처 카드가 자동 보충된다.
- 신규 카드 아트·외부 배포 없음.
- typecheck·110테스트·build PASS. 최종 브라우저 시각 검수는 연결 종료로 미완료.

## 2026-07-01 활성 로스터 20명

- `pado`와 `peanut`을 캐릭터·시그니처 카드·라이브 PNG·생성 배치에서 삭제했다.
- 현재 캐릭터는 T6·P5·Z9의 20명이다.
- 삭제 캐릭터의 기존 저장은 무효화하며 제작용 마스터·리뷰 자료만 보존한다.
- typecheck·112테스트·build PASS.

## 2026-07-01 캐릭터 공격 모션 20종 완료

- `cwe` 공격 보드 20개를 5×5, 320px 프레임의 투명 RGBA 시트로 가공했다.
- 라이브: `assets/game/character-motion/{id}.png`.
- 리뷰·QA: `assets/review/character-attack-cwe-v1/`, 20/20 PASS.
- 흰 체크 배경과 닫힌 흰 틈, 프레임 번호, 인접 셀 검기 혼입을 제거했다.
- 모든 프레임의 발 기준선을 고정하고 몸통 중심 편차를 제한했다.
- 플레이어 실루엣은 지두두 기준 208.38px로 통일했다.
- T 총격, P/Z 칼질 공격 시트를 `BattleStage`에 연결했으며 정적 대기는 유지한다.
- typecheck·112테스트·build·실제 전투 화면 QA PASS.
