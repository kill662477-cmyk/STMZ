# OpenCode 인수인계서 — SLAY THE MONSTARZ (전체 잔여 작업)

갱신: 2026-06-29 (Claude). 목적: **남은 작업 전체**를 우선순위로 정리. OpenCode가 위에서부터 가능한 데까지 진행.

---

## 0. 시작 전 필수

1. 읽기: `docs/PLAN.md` → `GAME_DESIGN.md` → `ART_DIRECTION.md` → `PROJECT_CHECKPOINT.md` → `STATUS.md` → `HANDOFF.md`(절 번호가 작업이력, 최신이 제일 아래).
2. 검증 기준선(작업 후 항상 통과 유지):
   ```powershell
   Set-Location "C:\Users\silve\OneDrive\Desktop\slay-the-monstarz"
   npm.cmd run typecheck
   npm.cmd run test      # 현재 ~104개 통과
   npm.cmd run build
   ```
3. 각 묶음 끝나면 typecheck·test·build·(가능하면)브라우저 검증 → `docs/HANDOFF.md`에 절 추가 + `STATUS.md` 갱신.

## 0-1. 절대 규칙

- **Act 1·2 맵 생성(`actOne.ts`·`actTwo.ts`)과 그 테스트는 건드리지 말 것.** 신규는 가산식.
- 막 콘텐츠 시드는 `actSalt(act)=(act-1)*7919` 패턴 유지(1막 RNG 불변).
- **Supabase 금지. AetherForge 금지.**
- 코드 스타일은 기존 순수TS 엔진/React/Pixi 경계 유지(엔진은 콘텐츠/렌더러 비의존).
- 라이브 에셋 덮어쓰기·외부 배포는 사용자 승인 후.

## 0-2. 이미지 — OpenCode가 직접 생성 가능

- **OpenCode도 `tools/gen_images.py`로 직접 이미지 생성 가능**(Gemini, 키 `GEMINI_API_KEY` in `.env.local`, 결제 활성됨). 코드 연동도 OpenCode가 한다. 즉 **생성+QA+연동 전부 OpenCode 가능**.
- 사용법·주의점은 맨 아래 **부록 A — 이미지 생성 가이드** 참고.
- 승인 규칙: 생성물은 `assets/review/`에 두고 QA 후 **사용자 승인분만** 라이브로 승격(카드=`assets/game/cards/`, 캐릭터마스터=`assets/masters/{id}/`).

---

## 현재 상태 (완료된 것)

- 엔진: 카드 전투(BattleEngine), 상태이상 취약/약화/힘, 드로우/에너지/소멸. 런(RunEngine) 1·2·3막, 지도→전투→보상→이벤트→상점→보물→휴식→엘리트→보스, 자동저장/이어하기, 막 전환 이월(+최소체력 35% 보장).
- 콘텐츠: 공용카드 16종(+강화), 유물 5, 포션 2, 적 P/T/Z×3막+엘리트+보스 3종, 막별 지도.
- 경제: 희귀도 상점(카드4·유물2·포션2), 골드.
- UI: 시작/지도/전투(Pixi)/보상/이벤트/상점/보물/휴식/덱보기/결과/막테마.
- 밸런스: 막별 풀런 QA, 난이도 튜닝. 테스트 ~104.
- 이미지: **원화 전부 생성·승격 완료(2026-06-29)** — 카드 16(라이브 `assets/game/cards/`), 캐릭터 마스터 22(`assets/masters/{id}/`), 적 마스터 16(`assets/masters/{id}/`), 배경 3(라이브 `assets/game/stage_bg_act{1,2,3}.png`). 전부 녹색배경 원화(스프라이트 가공 전).
- 현재 활성 로스터: **캐릭터 20명(T6·P5·Z9) + 캐릭터 선택 화면 + 종족별 시작덱(T/P/Z_STARTER)·시작유물 + 배경 3종** 완료. `pado`, `peanut`은 2026-07-01 삭제.

---

# 잔여 작업 백로그 (우선순위)

## TRACK 1 — 다중 캐릭터 (대부분 완료, 마무리만)
- [x] 캐릭터 20명 정의(`battleContent.characters`: T6·P5·Z9, race·maxHp·baseEnergy 3·종족 시작덱·startingRelic).
- [x] 캐릭터 선택 화면(`CharacterSelect` in RunGame) + `createRun(characterId)` + 시드 랜덤화.
- [x] **종족별 보상·상점 드래프트 풀 분리**(§8·§9): `cardPools.ts`와 `RunEngine.cardPool()`로 P/T/Z 풀 분리 완료.
- [x] **시그니처 카드 1/캐릭터**(§9): 22장 정의, 시작 덱 교체, 강화·UI·기존 저장 마이그레이션 완료.
- [ ] (선택) **고유 시작 유물**: 현재 기존 5유물 재사용 → 캐릭터별 고유 유물로 차별화(§9).
- [ ] **캐릭터 스프라이트 연동**: 현재 전원 `texture:"jdd"` 임시 공유 → TRACK 6 가공 후 전용 텍스처 키로 교체.
- 완료기준: 종족별로 다른 보상 카드 등장 + 시그니처 카드 존재 + (가공 후) 각자 스프라이트.

## TRACK 2 — 전투 깊이 / 상태이상 완성 (§6·§7)
- [ ] **상태이상 8종 완성**: 현재 취약·약화·힘만. 추가: 중독(턴시작 피해 후 1감소), 재생(턴종료 회복 후 1감소), 보호막유지(방어도 다음턴 유지), 기절(적 행동 1회 취소, 보스는 면역→지연/감소), 취약방어(받는 방어도 -25%). `StatusKind`·`tickStatuses`·`dealDamage`/턴 처리 확장.
- [ ] **카드 유형 확장**(§6): 파워(지속), 저주, 중립. `CardType`·`Effect` 유니온 확장(저주는 손패 점유/소멸 등).
- [ ] **적 파워·다양화**: 적이 힘/중독 사용, 보스 페이즈·텔레그래프(§11 막별 핵심연출: 포격예고/소환/보호막파괴강화/광폭화/드론/주포).
- [ ] (대형) **다중 적 전투**: §6 "앞쪽 적부터" → 현재 1v1. 다수 적 지원은 엔진·타겟팅·UI 큰 변경. 별도 묶음.
- 완료기준: 신규 상태이상 단위테스트 + 전투에서 동작.

## TRACK 3 — 콘텐츠 볼륨
- [ ] **카드 확충**: 종족별 충분한 풀(다양한 빌드). 강화 변형 점검.
- [ ] **유물 확충**: 현재 5 → 일반/고급/희귀 분포, 캐릭터 시작유물(22), 보스 핵심유물.
- [ ] **포션 확충**: 현재 2 → 다양화.
- [ ] **이벤트 확충**: 현재 3(`content/events.ts`) → 막별 다양화.
- [ ] **보스 보상 화면**(§10): 보스 처치 시 희귀카드 3중1 + 핵심유물 3중1(현재 보스는 막 전환만, 전용 보상 없음).
- 완료기준: 각 데이터 추가 + 풀/보상 연결 + 테스트.

## TRACK 4 — 지도/런 생성 규칙 (§5)
현재 맵은 층마다 고정 타입. §5 규칙 적용 필요.
- [ ] 같은 층 전부 동일 종류 금지(1·6층 예외), 상점·엘리트 2연속 금지, 1막 첫 엘리트 전 카드보상 최소 2회, 모든 경로 보스 직전 휴식 가능.
- [ ] STS식 노드 분포(층마다 혼합 타입). **단 Act1/2 기존 생성·테스트 보존** → 새 생성기를 옵션/3막부터 적용하거나 신중히.
- 완료기준: 규칙 단위테스트 + 시드별 검증.

## TRACK 5 — 화면/UX (§12 13종)
기존: 타이틀/지도/전투/보상/이벤트/상점/휴식/보물/덱보기/결과.
- [ ] **캐릭터 선택**(=TRACK 1).
- [ ] **설정·일시정지**: 볼륨, 모션감소, 그만두기/재시작, 키 안내.
- [ ] **부팅/타이틀 폴리시**.
- [ ] 지도: 현재 층 표시, §5 경로 시각화.
- 완료기준: 각 화면 추가 + 접근성(아래 TRACK 8).

## TRACK 6 — 이미지: 생성 끝, 이제 가공·연동만
**원화 생성은 전부 완료**(카드16·캐릭터22·적16·배경3 → `assets/masters/{id}/` 및 `assets/game/`). 남은 건 코드 연동.
- [x] 적 마스터 13 생성·승격(1막3·2막5·3막5), 배경 3 생성·라이브, 캐릭터22·카드16 완료.
- [ ] **막별 배경 로드**: act2/act3 bg 파일은 `assets/game/`에 있으나 코드가 `stage_bg_act1.png`만 import(`BattleStage.ts`·`RunGame.tsx`) → `run.state.act`로 분기 로드. **(가장 쉬운 첫 작업)**
- [ ] **마스터 → 투명 스프라이트**: 녹색 크로마 제거. ⚠️ 배경이 순수 #00ff00 아니라 약간 올리브빛 → `tools/keypose_board.py` 크로마 허용범위 넓혀야 함.
- [ ] **키포즈 보드**(캐릭터22·적16): 대기/공격/피격, `assets/review/enemy-motion-gpt-board-v1` 형식 + `keypose_board.py` → `BattleStage` AnimatedSprite.
- [ ] **임시 텍스처 교체**: 신규 적 전원 `texture:"scout"/"queen"`, 신규 캐릭터 전원 `texture:"jdd"` 공유 중 → 가공 후 전용 키로. `battleContent.texture` + `BattleStage`의 텍스처 맵/`ENEMY_MOTION`.
- [ ] (선택) 캐릭터 정면 초상(선택화면용, §13), 포션/유물 아이콘(현재 이모지/텍스트).
- 참고: 카드 아트는 `cardArtUrl` 자동탐지 — 완료. 신규 이미지 생성은 `tools/gen_images.py --prompts tools/<X>_prompts.json --out assets/review/<X>` (부록 A).

## TRACK 7 — 오디오
- [ ] SFX: 카드 사용/타격/방어/UI — **오디오 이벤트 시스템** 경유(ui-code 규칙: UI가 직접 재생 금지).
- [ ] BGM: 막별 + 보스. 모션/사운드 설정 연동(TRACK 5 설정).

## TRACK 8 — 접근성 / ui-code 규칙 (현재 전반 미준수)
`.claude/rules/ui-code.md` 기준:
- [ ] **로컬라이즈 시스템**: 하드코딩 한국어 → 문자열 테이블(다국어 대비).
- [ ] **게임패드/키보드** 모든 인터랙션 지원.
- [ ] **색맹 모드 + 확대 텍스트**(필수 규칙).
- [ ] 애니메이션 스킵·모션감소 일관 적용(일부만 됨).
- [ ] 최소/최대 해상도 테스트.

## TRACK 9 — 기술/배포/폴리시
- [ ] **Vercel 배포**(사용자 승인 후).
- [ ] 번들 최적화: Pixi 주 청크 500kB 경고 → 코드스플릿/manualChunks.
- [ ] 저장 버전 견고성(콘텐츠 증가 대비 마이그레이션).
- [ ] CI: push 시 typecheck/test.
- [ ] 폴리시: 보스 텔레그래프·페이즈, 상태/카드별 VFX, 시그니처 카드 강화 연출.

---

## 제외 (§15 — 만들지 말 것)
멀티/협동, 실시간 자동공격, 캐릭터 레벨·장비강화, 가챠·유료재화, 일일도전, 유저제작카드, 온라인 랭킹, 계정 서버동기화, 3D 전투, 음성연기, 20명 독립 카드풀, 과도한 고난도 시스템.

## 권장 진행 순서
TRACK 1(캐릭터 플레이가능, 임시 스프라이트) → TRACK 2(상태이상) → TRACK 3(콘텐츠) → TRACK 5 설정/부팅 → TRACK 6 연동(이미지 준비분) → TRACK 4 맵규칙 → TRACK 7 오디오 → TRACK 8 접근성 → TRACK 9 배포. 각 단계 독립적이라 이미지 없이도 1·2·3·5는 진행 가능.

## 핵심 파일 지도
- 엔진: `src/game/engine/BattleEngine.ts`, `types.ts`, `rng.ts`
- 런: `src/game/run/RunEngine.ts`, `actOne.ts`/`actTwo.ts`/`actThree.ts`, `runBattle.ts`, `runPersistence.ts`
- 콘텐츠: `src/content/battleContent.ts`(카드·캐릭터·적), `relics.ts`, `potions.ts`, `events.ts`, `cardArt.ts`
- UI: `src/ui/RunGame.tsx`, `BattleScreen.tsx`, `deckView.ts`; `src/game/pixi/BattleStage.ts`
- 이미지 도구: `tools/gen_images.py`(Gemini), `tools/keypose_board.py`(처리), `tools/card_art_prompts.json`, `tools/character_prompts.json`
- 테스트: 각 모듈 옆 `*.test.ts` + `actOneFullRun`/`actTwoFullRun` 풀런 QA

---

## 부록 A — 이미지 생성 가이드 (OpenCode용)

**도구**: `tools/gen_images.py`(표준 라이브러리만, Gemini REST). 키 `GEMINI_API_KEY` in `.env.local`(결제 활성). 모델 `gemini-2.5-flash-image`(Nano Banana).

**기본 실행**:
```powershell
Set-Location "C:\Users\silve\OneDrive\Desktop\slay-the-monstarz"
python tools/gen_images.py --prompts tools/<X>_prompts.json --out assets/review/<폴더>
#  옵션: --only id1,id2  --overwrite  --limit N  --delay 3
```
프롬프트 JSON: `card_art_prompts`/`character_prompts`/`act1_enemy_prompts`/`act2_enemy_prompts`/`act3_enemy_prompts`/`background_prompts`. 형식 = `{defaultModel,negativePrompt,globalStyle,globalConstraints,styleRef?,assets:[{id,prompt,ref?}]}`. 다중 입력이미지: `styleRef`(전역) + asset `ref`(assets/refs 등).

**검증/QA(생성 후 꼭)**: 이미지 직접 열어 — 글자/로고/워터마크 없음, 잘림 없음, 의도한 구도. 불량은 `--only <id> --overwrite`로 재생성. (모델이 가끔 글자·스케일인물을 넣음.)

**자산별 핵심 규칙**:
- 카드: 정사각 1024², 능력 모티프(얼굴·캐릭터 금지), 게임은 `object-fit:cover`로 120×108에 중앙크롭 → 모티프 중앙. 승격 `assets/game/cards/{id}.png`(자동연동).
- 캐릭터: **입력 2장** = ①styleRef `assets/review/style_anchor_armor.png`(jdd 얼굴 잘라낸 갑옷 크롭=그림체 앵커) + ②ref 멤버사진(얼굴). **jdd 원화 전체를 앵커로 쓰면 얼굴이 복사되는 버그 → 얼굴없는 크롭 필수.** 종족복은 프롬프트로 P/T/Z 구분. 측면 우향. 승격 `assets/masters/{id}/{id}_master.png`.
- 적: 측면 좌향, 평면 크로마, 종족색. 승격 `assets/masters/{id}/`.
- 배경: 16:9 와이드, 중앙·하단 비움. 승격 `assets/game/stage_bg_act{n}.png`.
- 공통: 배경 초록이 약간 올리브빛으로 나옴 → 크로마 제거 시 허용범위 고려. 승인 전 라이브 승격 금지.

**승격 규칙**: 생성=`assets/review/`, 사용자 승인분만 라이브(`assets/game/` 또는 `assets/masters/`).
