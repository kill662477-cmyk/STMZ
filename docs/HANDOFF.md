# SLAY THE MONSTARZ — 작업 인수인계

- 작성일: 2026-06-28
- 인계 상태: **3막 플레이 가능 + 전 막 10층·2체전 완료**
- 프로젝트 루트: `C:\Users\silve\OneDrive\Desktop\slay-the-monstarz`
- 현재 단계: **전체 게임 구성 완성도·밸런스·폴리시 보강**

## 0. 최신 인계 상태 — 2026-07-01 전 막 10층·2체전

- 모든 막은 10층이다:
  1·2 일반전 / 3 이벤트 / 4 기존 적 2체전 / 5 상점+엘리트 /
  6 기존 적 2체전 / 7 보물 / 8 기존 적 2체전 / 9 휴식 / 10 보스.
- `src/game/run/actMap.ts`가 공통 지도 골격과 연결을 생성한다.
  막별 파일은 테마·기존 적 ID·보스 ID만 제공한다.
- 2체전은 새 적을 만들지 않고 각 막 일반 적 3종을 두 종류씩 조합한다.
- 전투 상태는 `enemies[]`와 기존 호환용 현재 대상 `enemy`를 함께 둔다.
  적 두 체가 각각 의도와 행동 순서를 가지며 전부 쓰러뜨려야 승리한다.
- 전투 화면은 두 스프라이트와 HUD를 동시에 표시하고 적별 공격·피격·
  방어·사망 연출을 지원한다.
- 기존 `f1`~`f7` 노드 ID 의미는 보존했다. 신규 삽입 ID는
  `f3b`·`f4b`·`f5b`라 구형 저장의 주요 노드 타입이 바뀌지 않는다.
- 실제 화면에서 10층 지도, 4층 2체 렌더, 두 적의 연속 행동,
  콘솔 오류·경고 0을 확인했다.
- 검증: typecheck, **116테스트**, production build PASS.
- 향후 신규 이미지는 Codex가 직접 만들지 않는다. 필요한 사양만
  `docs/IMAGE_REQUESTS.md`에 남기고 게임 구성 완성을 우선한다.

## 0.1 이전 인계 상태 — 2026-07-01 카드 아트 60종

- 활성 카드 60종(공용 40·시그니처 20)에 전용 아트를 연결했다.
- 라이브 경로: `assets/game/cards/{cardId}.png`.
- `src/assets/cardArt.ts`의 glob 로더가 파일명을 카드 ID로 자동 등록한다.
- 원본 `abc`는 보존했다. 최종 후보·접촉 시트·QA 보고서는
  `assets/review/cards-abc-v1/`에 있다.
- 15종의 밝은 생성 캔버스 외곽선을 사방 12px 크롭했고,
  `rang_signature`와 `seventytwo_signature`의 반대 종족 테마를 바로잡았다.
- 최종 형식은 60/60 1024×1024 불투명 RGB이며 누락·초과·정확 중복·
  지각 중복은 모두 0이다. 라이브와 최종 후보의 SHA-256도 60/60 일치한다.
- 기존 라이브 17종 백업:
  `assets/game/cards-backup/20260701-110102/`.
- 실제 전투에서 일반 손패, Rang `차원 절단`, 72 `72개의 가시`를 확인했다.
  흰 외곽선·빈 여백 없이 렌더링되고 종족 테마가 올바르다.
- 검증: py_compile, typecheck, 112테스트, production build PASS.
- 외부 저장소·Supabase·CDN 배포는 하지 않았다.

## 0.2 이전 인계 상태 — 2026-07-01 캐릭터 공격 모션

- 활성 20명(T6·P5·Z9) 모두 전용 25프레임 공격 시트를 사용한다.
- 라이브 경로: `assets/game/character-motion/{id}.png`.
- 정적 대기 컷아웃은 `assets/game/characters/{id}.png`를 계속 사용하며,
  지두두 대기는 `jdd_idle_sheet.png` 첫 프레임만 사용한다.
- `BattleStage.ts`는 대기와 공격 시트의 격자·스케일·하단 여백을 각각
  관리한다. 플레이어 실루엣 높이는 지두두 기준 208.38px로 통일했다.
- 공격 시트 가공은 `tools/character_attack_sheets.py`가 담당한다.
  체크 배경 제거, 인접 셀 분리, 프레임 번호 제거, 몸통 중심 안정화,
  발 기준선 정렬, 안전 여백 검사를 재현할 수 있다.
- 최종 QA: `assets/review/character-attack-cwe-v1/summary.json` 20/20 PASS,
  typecheck·112테스트·build·실제 전투 화면 확인 PASS.
- 외부 저장소·Supabase·CDN 배포는 하지 않았다.

## 1. 반드시 먼저 읽을 문서

1. `docs/PROJECT_CHECKPOINT.md`
2. `docs/STATUS.md`
3. `docs/COMBAT_FEEL_POLICY.md`
4. `docs/GAME_DESIGN.md`
5. `docs/ART_DIRECTION.md`
6. `docs/PLAN.md`
7. 이 문서

## 2. 현재 라이브 상태

### 적용 완료

- React + TypeScript + Vite UI
- PixiJS 전투 연출
- 순수 TypeScript 전투 엔진
- 지두두 캐릭터
- 부유 파수병 일반전
- 군체 여왕 보스전
- 지두두 대기 AnimatedSprite
- 지두두 새 공격 AnimatedSprite
- 별도 Pixi 총구 섬광
- 피해 숫자, 피격 플래시, 화면 흔들림

### 라이브 에셋

- 승인 원화: `assets/game/jdd_battle.png`
- 현재 대기 시트: `assets/game/jdd_idle_sheet.png`
- 새 공격 시트: `assets/game/jdd_attack_sheet.png`
- 일반 적: `assets/game/sentinel_scout.png`
- 보스: `assets/game/brood_queen.png`
- 일반 적 모션: `assets/game/sentinel_scout_motion_sheet.png`
- 보스 모션: `assets/game/brood_queen_motion_sheet.png`
- 1막 배경: `assets/game/stage_bg_act1.png` (Pixi 배경 스프라이트)

### 승인 원본·검토 기록

- 부유 파수병 6포즈: `assets/review/enemy-motion-gpt-board-v1/sentinel_scout/`
- 군체 여왕 6포즈: `assets/review/enemy-motion-gpt-board-v1/brood_queen/`
- 두 게임용 시트 모두 `tools/keypose_board.py` 검사에서 셀 경계 접촉 0, 안전 여백 12px 이상.

## 3. 공격 모션 수정 결과

기존 공격 시트는 Aether 원본부터 머리카락, 총과 총구 섬광이 셀 경계에서 잘려 있었다. 사후 패딩으로 복구할 수 없어 폐기했다.

### 채택한 공격 모션

- 전용 입력: `assets/masters/jdd/jdd_sprite_reference.png`
- Aether 원본: `aether-output/jdd-attack-regenerate-padded/sprite-01.png`
- 처리본: `aether-output/jdd-attack-regenerate-padded/jdd_attack_sheet_processed.png`
- 라이브: `assets/game/jdd_attack_sheet.png`

검증:

- 25프레임 모두 셀 경계 접촉 없음.
- 실제 브라우저 공격 중간 프레임에서 전신·총 전체 표시.
- 총구 섬광을 스프라이트에서 분리해 Pixi VFX로 연결.
- `npm.cmd run typecheck` 통과.
- `npm.cmd run build` 통과.
- 브라우저 콘솔 오류 0.

## 4. 정확한 중단 지점 — 대기 모션

### 대기 시트 (교체 완료)

- 라이브 `assets/game/jdd_idle_sheet.png` = 두 번째 후보(정지·경계 접촉 0/25)로 교체됨.
- 이전(경계 접촉 있던) 시트는 `assets/game-backup/20260627-214705/`에 백업.

### 첫 번째 새 대기 후보 — 탈락

- 폴더: `aether-output/jdd-idle-regenerate-padded/`
- 원본: `sprite-01.png`
- 탈락 이유: 발을 번갈아 움직여 대기 모션이 아니라 걷기 모션처럼 보임.
- 후처리·승격하지 않음.

### 두 번째 새 대기 후보 — 검수·승격 완료 (2026-06-27)

- 폴더: `aether-output/jdd-idle-regenerate-stationary/`
- 원본 `sprite-01.png`, GIF `sprite-02.gif`, 검토 처리본 `jdd_idle_sheet_review.png`.
- 검수 결과: 정지 대기(발 고정) 확인, 알파 경계 접촉 0/25, 최소 여백 L5·R39·T66·B73px.
- 셀별 알파블리드 후 `assets/game/jdd_idle_sheet.png`로 승격. 기존 라이브는 `assets/game-backup/20260627-214705/`에 백업.
- `BattleStage`에서 idle/attack 스케일·기준선 통일(`PLAYER_SCALE=1.38`)로 전환 매끄러움. typecheck·build 통과, 콘솔 오류 0.

대기 모션 중단 지점은 해소됨. 다음은 적·보스 모션(사용자 승인 후) — `ART_DIRECTION.md` 7절 방침 우선.

## 5. 다음 작업 절차

적·보스 모션 단계는 완료됐다. 다음 단계는 사용자와 아래 중 하나를 합의한다.

1. 보스 강공격 텔레그래프·페이즈 연출.
2. 상태이상·카드 속성별 절차적 VFX.
3. 카드 UI·보상·덱빌딩 화면.
4. 지도·이벤트·상점 등 1막 런 구조.

## 6. 레거시 Aether 파이프라인

`tools/aether_assets.py`에 다음 기능을 추가했다.

- `prepare-sprite-reference`
  - 승인 원화를 같은 크기의 녹색 캔버스 안에서 축소·배치한다.
  - Aether 입력 자체에 실제 안전 여백을 만들기 위한 명령.
- `process-sheet --padding`
  - 프레임별 투명 여백 추가.
- `process-sheet --content-scale`
  - 프레임 내부 콘텐츠 축소.

잘린 원본은 패딩으로 복구할 수 없다. `prepare-sprite-reference`를 생성 전에 사용한다.

이 절은 기존 지두두 산출물의 역사 기록이다. 사용자 방침에 따라 신규 마스터·모션 생성에는 Aether와 make-sprite를 사용하지 않는다.

## 7. 코드 변경

`src/game/pixi/BattleStage.ts`

- 공격 시트 전용 `ATTACK_SCALE` 적용.
- 공격 시트의 발 기준선 보정.
- 공격 시트에서 제외한 총구 섬광을 Pixi Graphics VFX로 구현.
- 공격 완료 후 기존 대기 스케일과 위치로 복귀.

## 8. 생성·승격 현황

### 생성

- 공격 재생성 후보 2회
  - 첫 후보: 여백 미준수로 탈락
  - 두 번째 후보: 채택 및 라이브 승격
- 대기 재생성 후보 2회
  - 첫 후보: 걷기 동작으로 탈락
  - 두 번째 후보: 미검수
- GPT 이미지 키포즈 보드 후보
  - 부유 파수병 3×2 보드: 6셀 기술 QA 통과, 라이브 승격 완료
  - 군체 여왕 2×3 보드: 6셀 기술 QA 통과, 라이브 승격 완료

### 승격

- `assets/game/jdd_attack_sheet.png` 교체(이전 세션).
- `assets/game/jdd_idle_sheet.png` 교체(이번 세션, 두 번째 후보 승격).
- `assets/game/sentinel_scout_motion_sheet.png` 추가.
- `assets/game/brood_queen_motion_sheet.png` 추가.

### 백업

- `assets/game-backup/20260627-183825/jdd_attack_sheet.png`
- 이전 진단 백업: `assets/game-backup/20260627-182037/`

### 미실행

- Supabase/CDN 업로드 없음.
- 배포 없음.
- 외부 CDN 승격 없음. 라이브 게임은 로컬 에셋을 사용한다.

## 9. 검증 명령

```powershell
python -m py_compile .\tools\aether_assets.py
npm.cmd run typecheck
npm.cmd run build
```

`src/game/engine/BattleEngine.test.ts`가 다단 공격의 타격별 피해와 방어도 흡수를 검증한다. 브라우저에서 일반전과 보스전, 대기→공격→대기 전환도 직접 확인해야 한다.

## 10. 주의사항

- 생성됐다는 이유만으로 합격 처리하지 않는다.
- 사용자 승인 없이 적·보스 후보를 라이브로 승격하거나 추가 대량 생성하지 않는다.
- 레퍼런스 얼굴과 헤어 정체성을 바꾸지 않는다.
- 잘린 원본을 사후 패딩으로 복구하려 하지 않는다.
- 미검수 대기 후보를 라이브 폴더에 복사하지 않는다.
- 신규 생성에 AetherForge 또는 make-sprite를 사용하지 않는다.

## 11. 최신 인수인계 — 전투 VFX·타격감 완료 (2026-06-27)

### 이번 작업

- `src/game/pixi/BattleStage.ts`
  - 피해량 3단계 타격 정책 추가.
  - 타격 프레임에 히트스톱, 피격 플래시, 광선·링·파편 임팩트, 넉백, 피해 숫자, 피해 비례 화면 흔들림 동기화.
  - 겹치는 화면 흔들림과 넉백의 좌표 충돌 방지.
  - 플레이어·적 공용 `block(target, amount)` 실드 VFX 추가.
  - 다단 공격은 한 공격 모션 안에서 타격별 총구 섬광·임팩트·숫자를 분리.
- `src/game/engine/BattleEngine.ts`
  - 피해 이벤트에 실제 타격별 HP 피해 배열 `hitAmounts` 추가.
- `src/ui/BattleScreen.tsx`
  - `hitAmounts`를 스테이지에 전달하고 적 방어 행동도 실드 VFX로 재생.
- 세부 규칙은 `docs/COMBAT_FEEL_POLICY.md` 참고.

### 검증 완료

- `npm.cmd run typecheck`
- `npm.cmd run test`
- `npm.cmd run build`
- 일반전 중사격 `-11` 확인.
- 연사 `-3`, `-3` 개별 타격 확인.
- 플레이어 방어 `+5`, 적 방어 `+6` 실드 확인.
- 적 원거리 투사체와 피격 반동 확인.
- 공격·숫자·실드 잘림 없음.
- 브라우저 콘솔 오류 0.

### 다음 작업

전투 타격감과 파수병·군체 여왕 고품질 키포즈 모션은 완료 상태다. 다음 콘텐츠 묶음은 사용자와 하나만 합의한 뒤 진행한다.

## 12. 최신 인수인계 — 적·보스 키포즈 모션 완료 (2026-06-28)

- `tools/keypose_board.py`에 프레임 콘텐츠 높이·중심축·바닥 여백 정규화 기능 추가.
- 파수병 게임 셀 `384×480`, 콘텐츠 높이 340px, 바닥 여백 24px.
- 여왕 게임 셀 `640×384`, 콘텐츠 높이 300px, 바닥 여백 24px.
- `BattleStage`의 적을 `AnimatedSprite`로 전환하고 대기 2 / 공격 3 / 피격 1 포즈 연결.
- 기존 원거리 투사체와 근접 런지, 임팩트, 사망 연출은 유지.
- 일반전·보스전 브라우저 검증, 잘림 없음, 콘솔 경고·오류 0.
- Python 컴파일, typecheck, 테스트, build 통과.

## 13. 최신 인수인계 — Codex Game Studios 설치 및 1막 런 엔진 기반 저장 (2026-06-28)

### Codex 호환 플러그인

- 전역 개인 플러그인 `codex-game-studios` 버전 `1.0.0`을 설치·활성화했다.
- 소스: `C:\Users\silve\plugins\codex-game-studios`
- 설치 캐시: `C:\Users\silve\.codex\plugins\cache\personal\codex-game-studios\1.0.0`
- 구성: 원본 호환 워크플로 73개 + 통합 `$studio` 라우터 1개, 역할 가이드 49개.
- Claude 전용 `Task`, `AskUserQuestion`, `TodoWrite`, `.claude/` 경로는 Codex 방식으로 호환 처리했다.
- 현재 채팅에는 설치 후 재로딩되지 않았다. **Codex를 재시작하고 새 채팅을 열어야 플러그인을 사용한다.**
- 새 채팅의 시작점은 `$studio`이며, 팀 워크플로는 사용자가 명시적으로 팀/위임을 요청했을 때만 사용한다.
- 플러그인은 전역 설치이며 이 프로젝트에 Claude hooks/settings를 복사하지 않았다.

### 저장된 1막 런 엔진 기반 코드

- `src/game/run/types.ts`
  - 런 노드, 보상, 런 단계, HP·골드·덱·진행 상태 타입.
- `src/game/run/actOne.ts`
  - 시드 기반 7층 분기 지도 초안.
  - 현재 노드는 일반 전투와 마지막 보스만 있으며 휴식·상점·이벤트 등은 아직 없다.
- `src/game/run/RunEngine.ts`
  - 도달 가능한 노드 선택, 전투 진입, HP·덱 유지, 카드 3중1 보상·스킵, 막 승리·패배 상태.
- `src/game/run/RunEngine.test.ts`
  - 잠긴 노드 거부, HP·선택 카드 유지, 보스까지 경로 완주 테스트 3개.
- `src/game/engine/BattleEngine.ts`
  - 런에서 전달할 `playerHp`, `deck` 생성 옵션 추가.
- `src/content/battleContent.ts`
  - 보상 풀용 카드 `quickshot`, `suppress`, `bulwark`, `volley` 추가.

### 검증 결과

2026-06-28 현재 아래 명령이 모두 통과했다.

```powershell
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

- 테스트: 2파일, 5개 통과(기존 전투 2 + 런 엔진 3).
- 이 검증은 엔진 코드 기준이다. 런 화면은 아직 없으므로 지도→전투→보상 브라우저 흐름은 검증하지 않았다.

### 당시 정확한 중단 지점

- 이 절에 기록된 UI 미연결 상태는 14절 작업에서 해소했다.
- 지도 화면, 보상 화면, 화면 전환 컨트롤러, 전투 HP 반환과 다음 노드 이동이 현재 연결돼 있다.
- 당시 저장·이어하기는 미구현이었다. 현재는 22절에서 완료됐다.
- 7층·전투 전용 지도와 카드 수치는 임시 초안이며 최종 기획 확정으로 간주하지 않는다.
- 이번 런 엔진 작업 중 이미지 생성·라이브 에셋 교체·배포는 하지 않았다.

### 당시 새 채팅에 전달한 작업 순서

아래 1-7번은 14절에서 완료된 이전 작업 지시다.

1. Codex 재시작 후 새 채팅에서 `docs/PROJECT_CHECKPOINT.md`, `docs/STATUS.md`, 이 문서를 UTF-8로 읽는다.
2. `$studio`로 현재 단계와 위 중단 지점을 확인한다.
3. `src/game/run/`과 `BattleEngine`의 전달 옵션을 먼저 검토하되 이미 통과한 기반 코드를 불필요하게 다시 만들지 않는다.
4. 첫 구현 묶음은 **지도 → 전투 → 카드 보상 → 다음 지도**의 최소 세로 흐름으로 제한한다.
5. 전투 시작 시 `encounterId`, 현재 HP, 현재 덱, 전투 시드를 전달하고 승리 시 남은 HP를 `RunEngine.completeBattle()`로 돌려준다.
6. 카드 3중1 선택 또는 스킵 뒤 다음 도달 가능 노드를 보여준다.
7. 최소 흐름을 typecheck·test·build·브라우저로 검증한 다음에만 휴식·상점·이벤트·저장을 추가한다.
8. 신규 이미지가 필요해도 Aether를 사용하지 않는다. `ART_DIRECTION.md` 7절의 승인 원화 ref + GPT/Nano Banana 키포즈 보드 방침을 유지한다.

## 14. 최신 인수인계 — 1막 최소 런 UI 통합 완료 (2026-06-28)

### 구현한 흐름

`지도 → 전투 → 카드 보상 3중1/스킵 → 다음 도달 가능 지도`를 실제 React 앱에서 이어지게 만들었다.

- `src/App.tsx`
  - 앱 시작점을 `BattleScreen` 직행에서 `RunGame`으로 변경.
- `src/ui/RunGame.tsx`
  - 런 화면 컨트롤러, 7층 분기 지도, 런 HUD, 카드 보상, 승패 결과 화면 추가.
  - 승인된 `assets/game/stage_bg_act1.png`를 지도·보상 배경으로 재사용.
  - 완료·도달 가능·잠김 노드와 실제 연결선을 표시.
- `src/game/run/runBattle.ts`
  - 현재 런 HP·덱·캐릭터·노드 인카운터·전투 시드를 `BattleEngine`에 전달.
  - 승리 시 남은 HP를 `RunEngine.completeBattle()`로, 패배 시 `failBattle()`로 반환.
- `src/game/run/runBattle.test.ts`
  - 런 상태 전달, 승리 HP 반환과 보상 진입, 패배 런 전환 테스트 3개.
- `src/ui/BattleScreen.tsx`
  - 외부 `BattleEngine`을 받아 렌더하도록 변경.
  - 런의 층·노드 문맥을 상단에 표시하고 전투 종료 버튼으로 보상/결과에 복귀.
- `src/style.css`
  - 지도, 경로 상태, 카드 보상, 결과 화면, 좁은 화면 대응, 모션 감소 대응 추가.

### 검증

```powershell
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

- 테스트 3파일 8개 통과.
- 브라우저에서 지도 진입, 일반 전투 렌더, 카드 보상 3장, 선택 후 덱 증가와 다음 전투 진입 확인.
- 승인된 기존 전투 연출과 스프라이트 유지.
- 콘솔 경고·오류 0.
- 신규 이미지 생성·에셋 승격·외부 배포 없음.

### 현재 남은 범위

- 지도 노드는 아직 일반 전투와 보스만 실제 실행한다.
- 휴식·상점·이벤트·보물·엘리트 화면과 처리 규칙 미구현.
- 전투 골드 보상과 상점 경제 미연결.
- 당시 localStorage 저장·이어하기는 미구현이었다. 현재는 22절에서 완료됐다.
- 현재 7층 수치와 경로는 여전히 기획 초안이며 사용자 최종 승인본이 아니다.

### 다음 권장 묶음 (이전 — 15·16절에서 완료됨)

현재 연결을 보존하고 **6층 휴식 노드 한 종류**부터 추가한다.

1. `actOne.ts`의 6층을 `rest`로 고정한다.
2. `RunEngine`에 비전투 노드 진입과 완료 경계를 추가한다.
3. 휴식 화면에서 최대 HP 25% 회복 또는 카드 강화 중 하나를 선택하게 한다.
4. 회복 경로와 다음 보스 노드 해제를 테스트·브라우저 검증한다.
5. 이 묶음이 통과한 뒤 이벤트·상점·보물·엘리트를 각각 별도 묶음으로 추가한다.

## 15. 최신 인수인계 — 6층 휴식 노드 완료 (2026-06-28)

### 구현

- `src/game/run/types.ts`: `RunPhase`에 `rest` 추가.
- `src/content/battleContent.ts`: 모든 기본 카드의 강화 변형(`id+`)을 모듈 로드 시 자동 생성(피해·방어 +3, 상태이상 +1). 다단 공격은 타격당 +3.
- `src/game/run/actOne.ts`: 6층을 `rest`로 고정(`야영 모닥불`, `잔불의 쉼터`). 보스=7층, 일반전=1~5층.
- `src/game/run/RunEngine.ts`: `startNode`의 비전투 분기, `restHealAmount()`(최대 HP 25%), `upgradeableCards()`, `restHeal()`, `restUpgrade()`, `requireRestNode`/`finishRestNode` 경계.
- `src/ui/RunGame.tsx`: `RestScreen`(회복/단련 선택 → 강화 카드 선택), 휴식 단계 렌더 분기, `NODE_LABEL`.
- `src/style.css`: 휴식 화면 스타일.

### 검증

- `npm.cmd run typecheck`, `npm.cmd run test`(11개), `npm.cmd run build` 통과.
- 브라우저 지도에서 6층 `휴식` 라벨·노드명 확인, 콘솔 오류 0.

## 16. 최신 인수인계 — 3층 이벤트 노드 완료 (2026-06-28)

### 구현

- `src/content/events.ts`(신규): 데이터 기반 이벤트 3종(`버려진 보급고`, `정찰병의 유산`, `떠도는 밀매상`)과 효과 타입(`heal`/`loseHp`/`gainGold`/`loseGold`/`addCard`). 각 이벤트의 첫 선택지는 HP 비변경(런 진행 테스트가 HP 보존 가정).
- `src/game/run/types.ts`: `RunPhase`에 `event` 추가, `ActiveEvent` 타입과 `RunState.event` 필드 추가.
- `src/game/run/actOne.ts`: 3층을 `event`로 고정(`미지의 조우`, `잔해 속 흔적`).
- `src/game/run/RunEngine.ts`: `startNode`의 이벤트 분기, `pickEvent()`(노드 시드로 결정론적 선택), `currentEvent()`, `resolveEvent(choiceId)`, `applyEventChoice()`. HP 0 도달 시 `lost` 처리.
- `src/ui/RunGame.tsx`: `EventScreen`(제목·본문·선택지), `resolveEvent` 핸들러, 이벤트 단계 렌더 분기.
- `src/style.css`: 이벤트 화면 스타일.

### 검증

- `npm.cmd run typecheck`, `npm.cmd run test`(3파일 15개), `npm.cmd run build` 통과.
- 새 테스트 4개: 3층 이벤트 타입·무인카운터, 이벤트 진입·선택지 노출, 선택 효과 적용·지도 복귀·다음 층 해제, 비존재 선택지 거부.
- 브라우저 지도에서 3층 `이벤트` 라벨·노드명 확인(`미지의 조우`, `잔해 속 흔적`), 콘솔 경고·오류 0. (스크린샷 도구는 WebGL 캔버스로 인한 기존 타임아웃 이슈로 생략, DOM·콘솔로 검증.)

### 현재 맵 구성

1·2층 전투 → 3층 이벤트 → 4·5층 전투 → 6층 휴식 → 7층 보스.

### 다음 권장 묶음

상점·보물·엘리트·저장(localStorage 이어하기)을 각각 별도 묶음으로 추가한다. 골드는 현재 이벤트로만 변동하므로 상점 묶음에서 전투 골드 보상과 소비를 연결한다.

## 17. 최신 인수인계 — 4층 상점 노드 + 전투 골드 보상 완료 (2026-06-28)

### 구현

- **전투 골드 보상**: `RunEngine.completeBattle`이 일반전 승리 시 12~20 골드를 시드 기반으로 지급하고 `RunReward.gold`에 기록(보스는 막 종료라 제외). `RewardScreen`에 `골드 +N 획득` 표시.
- `src/game/run/types.ts`: `RunPhase`에 `shop` 추가, `ShopItem`·`ActiveShop` 타입, `RunState.shop` 필드, `RunReward.gold` 필드.
- `src/game/run/actOne.ts`: 4층을 `shop`으로 고정(`밀매상의 좌판`, `잔해 시장`). `ACT_ONE_SHOP_POOL`(카드 7종) 추가.
- `src/game/run/RunEngine.ts`: `buildShop()`(노드 시드로 4종 출품, 가격=40+비용*15+변동), `currentShop()`, `buyShopItem()`(골드 차감·덱 추가·판매처리), `removeCard()`(골드 75로 덱 1장 제거, 노드당 1회), `leaveShop()`, `requireShop()`.
- `src/ui/RunGame.tsx`: `ShopScreen`(구매 카드 4장 + 카드 제거 모드 + 떠나기), `buyShopItem`/`removeCard`/`leaveShop` 핸들러, 상점 단계 렌더 분기.
- `src/style.css`: 상점 화면·판매됨 카드·제거 UI·보상 골드 배지 스타일.

### 검증

- `npm.cmd run typecheck`, `npm.cmd run test`(3파일 **22개**), `npm.cmd run build` 통과.
- 새 테스트 7개: 전투 골드 지급, 4층 상점 타입·무인카운터, 가격 출품, 구매 골드 차감·덱 추가·판매처리, 골드 부족 거부, 카드 제거 1회 제한, 떠나기·다음 층 해제.
- 브라우저 지도에서 4층 `상점`(밀매상의 좌판·잔해 시장) 라벨 확인, 콘솔 경고·오류 0.

### 현재 맵 구성 (갱신)

1·2층 전투 → 3층 이벤트 → 4층 상점 → 5층 전투 → 6층 휴식 → 7층 보스.

### 다음 권장 묶음

보물(유물 획득)·엘리트(보장 유물 전투)·저장(localStorage 이어하기)을 각각 별도 묶음으로 추가한다. 유물 시스템은 18절에서 정의 완료했으므로 보물/엘리트는 곧바로 연결할 수 있다.

## 18. 최신 인수인계 — 최소 유물 시스템 정의 완료 (2026-06-28)

### 목적

보물·엘리트 노드가 지급할 유물의 데이터·엔진 기반. 노드 자체는 이번에 추가하지 않고 **시스템 정의만** 수행한다(노드는 별도 묶음). GAME_DESIGN §8(P/T/Z 정체성)·§10(희귀도·가격대)·§9(캐릭터 고유 시작 유물)에 맞춘 최소 설계.

### 구현

- `src/content/relics.ts` (신규)
  - `RelicRarity`("starter"|"common"|"rare"), `RelicEffect`(4종), `RelicDef`.
  - 유물 5종: 반응로 핵(combatEnergy+1), 갑각 판(combatBlock 6), 전투 자극제(combatDraw+1), 생체 이식체(maxHp+14), 네오스틸 골조(combatBlock 4 + combatDraw 1, 다중 효과 예시).
  - `battleModifiersFor(relicIds)`: 보유 유물 → `BattleModifiers` 집계(maxHp 제외).
- `src/game/engine/types.ts`: `BattleModifiers` 추가(순수 수치, 렌더러 독립).
- `src/game/run/types.ts`: `RunState.relics: string[]` 추가.
- `src/game/engine/BattleEngine.ts`
  - `BattleOptions.mods?: BattleModifiers`. 미지정 시 0 보정.
  - `playerMaxHp?` 옵션 추가: maxHp 유물로 증가한 런의 최대체력을 전투에 반영(미지정 시 캐릭터 기본값). hp 클램프 기준도 이 값.
  - `combatEnergy` → `baseEnergy`/`energy` 보정(매 턴). `combatDraw` → 매 턴 `draw(5+N)`.
  - `combatBlock` → 생성자 첫 `startPlayerTurn()` 직후 1회 부여. 이후 턴 시작의 `p.block=0`로 자연 소거(첫 턴 전용 보장).
- `src/game/run/RunEngine.ts`: `gainRelic(id)`(maxHp 효과 즉시 적용·중복 거부·미지정 유물 거부), `hasRelic(id)`, `battleModifiers()`. 초기 `relics: []`.
- `src/game/run/runBattle.ts`: `playerMaxHp: run.state.maxHp`, `mods: run.battleModifiers()` 전달.
- `src/ui/RunGame.tsx` + `src/style.css`: `RunHeader`에 보유 유물 칩(`rarity`별 색상) 표시. 700px 이하 숨김.

### 설계 의도(메모)

- 엔진(`engine/`)은 콘텐츠(`content/`)를 의존하지 않는다. `BattleModifiers`는 수치만 담고, 집계는 콘텐츠 계층(`relics.ts`)이 담당. 향후 localStorage 직렬화·다른 캐릭터 유물에도 동일 모델 재사용.
- 부활/전투 종료 회복/상태이상 부여형 유물은 이번 최소 범위에서 제외(GAME_DESIGN §15는 유물 1회성 부활을 허용하나, 별도 묶음에서 추가).
- 희귀도는 상점 가격대(§10)와 보물 보상 풀 설계의 기준점. 현재는 데이터 필드만.

### 검증

```powershell
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

- 테스트 3파일 **32개** 통과(신규 10개: 유물 8 + 엔진 보정 2). 유물 테스트: 미보유/영점 보정, maxHp 증가·상한 클램프, 다중 보정 집계, 다중 효과 유물 합산, 미지정·중복 거부, 런 전투로 보정 전달, maxHp 유물이 전투 maxHp·hp로 이월. 엔진 테스트: 매 턴 에너지·드로우 보정, 첫 턴 전용 방어도.
- 빌드 통과. 콘솔 검증: 신규 노드가 없어 일반 플레이엔 가시 변화 없음(예상). 보물/엘리트 노드 추가 시 브라우저에서 유물 획득·HUD·전투 보정을 직접 확인한다.
- 신규 이미지 생성·라이브 에셋 교체·외부 배포 없음.

### 다음 권장 묶음

1. ~~**보물 노드**~~ — 19절에서 완료.
2. **엘리트 노드**: 강적 전투 + 승리 시 보장 유물 보상.
3. **저장/이어하기**: `RunState` 직렬화(localStorage, 버전 필드). 유물과 무관하게 독립 진행 가능.

## 19. 최신 인수인계 — 5층 보물 노드 완료 (2026-06-28)

### 구현

- `src/game/run/types.ts`: `RunPhase`에 `treasure` 추가, `ActiveTreasure`(`sourceNodeId`, `relicIds: string[]`) 타입, `RunState.treasure` 필드.
- `src/game/run/actOne.ts`: `TREASURE_FLOOR = 5`, `TREASURE_TITLES`(`봉인된 금고`, `잊혀진 보물고`). `createActOneMap`에서 5층을 `treasure`로 분기(서브타이틀 `보물 · 유물 3중1`, encounter 없음).
- `src/game/run/RunEngine.ts`:
  - `startNode`에 treasure 분기. `buildTreasure(node)`: 노드 시드로 `ACT_ONE_RELIC_POOL`을 셔플, 이미 보유한 유물 제외, 상위 3종 추출.
  - `currentTreasure()`, `chooseTreasure(relicId | null)`. 선택 시 `gainRelic`로 18절 유물 시스템에 획득(효과 즉시 적용). 검증 후 `finishNode`로 다음 층(6층 휴식) 해제.
- `src/ui/RunGame.tsx`: `TreasureScreen`(유물 카드 3장: 이름·희귀도 배지·설명·플레이버 + `획득`, 하단 `건너뛰기`). `chooseTreasure` 핸들러, treasure 페이즈 렌더 분기. `RELIC_RARITY_LABEL`.
- `src/style.css`: `.treasure-layout`·`.treasure-relic`·희귀도별 색상(common=금색, rare=보라)·`.treasure-action`. `reward-arrive` 애니메이션 재사용.

### 현재 맵 구성 (갱신)

1·2층 전투 → 3층 이벤트 → 4층 상점 → **5층 보물** → 6층 휴식 → 7층 보스.
(5층이 전투에서 보물로 바뀌어 일반 전투는 1·2층 2회 + 보스. 층별 단일 타입 할당은 여전히 기획 초안이며, §5의 층별 다중 노드 허용은 추후 확장.)

### 검증

```powershell
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

- 테스트 3파일 **37개** 통과(신규 5: 보물 층 타입·무인카운터, 3종 출품·미보유 보장, 선택 획득·효과 반영(`battleModifiersFor([choice])` 일치)·다음 층 해제, 스킵, 미포함 유물 거부). 기존 테스트 `advanceFloor`·풀런 루프에 treasure(스킵) 케이스 추가, 상점→다음 층 단언을 `battle`→`treasure`로 갱신.
- 빌드 통과. 브라우저 검증 권장: 5층 진입 시 보물 화면, 유물 선택 후 헤더 유물 칩 노출, 보스전에서 전투 보정(에너지/드로우/방어도/maxHp) 확인.
- 신규 이미지 생성·라이브 에셋 교체·외부 배포 없음.

### 다음 권장 묶음

1. ~~**엘리트 노드**~~ — 20절에서 완료.
2. **저장/이어하기**: `RunState`(버전 필드 포함, 유물·상점·보물 임시 상태 제외)를 localStorage에 직렬화. 전투 중 새로고침 시 해당 전투 시작 상태로 복원(§3).

## 20. 최신 인수인계 — 4층 엘리트 노드(혼합 경로) 완료 (2026-06-28)

### 구현

- `src/content/battleContent.ts`: 엘리트 적 `elite_sentinel`(`정예 파수병`) 추가. HP 46, 행동 3종(집중 사격 12 / 강화 보호막 9 / 제압 탄막 5×2+약화1). `tier:"normal"`, **`texture:"scout"`(부유 파수병 스프라이트 재사용)**. 전용 키포즈 보드 승인 전 임시.
- `src/game/run/types.ts`: `RunReward.relicId?: string` 추가.
- `src/game/run/actOne.ts`: `ELITE_TITLES`/`ELITE_ENCOUNTER`. **4층을 상점+엘리트 혼합 층으로 변경** — `index === 1`(중간 노드)을 `elite`로, 나머지 인덱스를 `shop`으로 할당. 상점 타이틀은 엘리트를 건너뛴 `shopIndex`로 중복 없이 부여.
- `src/game/run/RunEngine.ts`: `completeBattle`가 `node.type === "elite"`일 때 골드 `35 + int(11)`(35~45) + 보장 유물(`ACT_ONE_RELIC_POOL` 셔플 후 미보유 1종)을 `reward.relicId`에 설정. `chooseReward`가 카드 선택/스킵과 무관하게 `reward.relicId`를 `gainRelic`로 지급.
- `src/ui/RunGame.tsx`: `RewardScreen`에 유물 배지(`reward.relicId` 있을 때, 희귀도별 색상).
- `src/style.css`: `.reward-relic`·`.reward-relic-label`(common=금색/rare=보라).

### 현재 맵 구성 (갱신)

1·2층 전투 → 3층 이벤트 → **4층 {상점, 엘리트} 혼합(경로 선택)** → 5층 보물 → 6층 휴식 → 7층 보스.
4층은 최초의 **혼합 층**(같은 층에 서로 다른 노드 타입 공존). 플레이어가 안전(상점)/고위험(엘리트·유물 확정) 경로를 선택. GAME_DESIGN §5의 층별 다중 노드 허용 방향으로의 첫 적용.

### 검증

```powershell
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

- 테스트 3파일 **40개** 통과(신규 3: 엘리트 승리 골드 35~45·보장 유물, 보상 청구 시 유물 지급, 미보유 유물 보장). 기존 "4층 = 상점 층" 테스트를 "4층 = 상점+엘리트 혼합" 단언으로 교체. 혼합 층 대응: `advanceFloor`·풀런 루프가 엘리트를 피해 비결정적 보상 회피(`pickNonElite`), 상점 테스트가 명시적으로 상점 노드 선택(`startShopNode`).
- 5개 시드(1/7/42/100/2026)로 엘리트 노드가 floor3→엘리트→floor5 양방향 도달 가능함을 추가 검증(임시 테스트로 실행 후 삭제).
- 빌드 통과. 브라우저 검증 권장: 4층에서 엘리트 경로 선택 → 정예 파수병 전투(scout 스프라이트) → 승리 시 유물 배지 → 헤더 유물 칩.
- 신규 이미지 생성·라이브 에셋 교체·외부 배포 없음.

### 다음 권장 묶음

1. ~~**저장/이어하기**~~ — 22절에서 완료.
2. **엘리트 전용 스프라이트**: GPT/Nano Banana 키포즈 보드 생성(승인 후 `assets/game/` 승격), `ENEMY_MOTION`에 신규 텍스처 키 추가 후 `elite_sentinel.texture` 교체. `tools/keypose_board.py` 파이프라인 사용.
3. **1막 콘텐츠 확충**: 카드 12~16장, 일반 적 3종, 포션 2종(§10·14).

## 21. 최신 인수인계 — OpenCode 카드 아트 작업 인수·복구 완료 (2026-06-28)

### 확인한 중단 지점

OpenCode GLM 세션은 토큰 만료 뒤 복구 가능한 세션 레코드를 남기지 않았다. 대신 마지막 파일 수정 시각과 내용을 대조해 아래 작업이 중간에 끊긴 것을 확인했다.

- `src/content/cardArt.ts`: 승인 카드 PNG 자동 탐지.
- `tools/card_art_prompts.json`: 최초에는 지두두 `strike` 카드 앵커 프롬프트였으나, 공용 카드 설계와 충돌해 아래와 같이 수정.
- `src/ui/BattleScreen.tsx`: 손패 카드 아트 창.
- `src/ui/RunGame.tsx`: 보상·강화 카드 아트 창. 상점 카드는 이관 도중 중단.
- `src/style.css`: 전투·보상 카드의 상단 아트/하단 정보 구조.
- `assets/game/cards/`, `assets/review/cards/`: 빈 폴더만 생성된 상태. 카드 이미지 후보 없음.

### 이어받아 완료한 내용

- 상점 카드도 보상·강화와 같은 아트/정보 패널 구조로 통일했다.
- 전투 카드 코스트 오브를 카드 내부로 옮겨 잘림을 제거했다.
- 모바일 카드의 아트 높이·본문 타이포를 조정했다.
- 카드 아트 경로를 모듈 초기화 시 `Map`으로 인덱싱해 렌더 경로의 반복 탐색을 제거했다.
- 승인 폴더와 검토 폴더에 README를 추가해 사용자 승인 전 승격 금지 규칙을 고정했다.
- Rollup Windows 선택 의존성을 복구했다.

### 카드 아트 파일 규칙

- 후보: `assets/review/cards/`
- 승인 라이브: `assets/game/cards/{cardId}.png`
- 공용 카드: 캐릭터별로 만들지 않고 같은 `{cardId}`를 쓰는 모든 캐릭터가 이미지 1장을 공유
- 캐릭터 전용 이미지: 별도 `cardId`를 가진 시그니처 카드만 허용
- 강화 카드: `{cardId}+`가 기본 `{cardId}.png` 자동 재사용
- 이미지 없음: 공격은 적갈색 마름모, 스킬은 청록 육각형 플레이스홀더
- 원본 일러스트에는 카드 프레임·UI·글자·숫자·워터마크 금지

### 검증

```powershell
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
npm.cmd audit --omit=dev
```

- 테스트 3파일 40개 통과.
- 프로덕션 의존성 취약점 0.
- 브라우저에서 아트 PNG가 없는 상태의 전투 손패를 확인했다.
- 공격/스킬 플레이스홀더, 코스트 오브, 이름·설명·유형 모두 정상 표시.
- 카드 아트 `<img>` 0개는 현재 후보·승인 이미지가 없으므로 정상.
- 콘솔 경고·오류 0.
- 코드리뷰: **APPROVED WITH SUGGESTIONS**.

### 다음 작업 (사용자 결정으로 보류)

1. `tools/card_art_prompts.json`의 공용 `strike` 프롬프트로 후보 1장만 생성한다. 캐릭터 레퍼런스는 사용하지 않는다.
2. 결과를 `assets/review/cards/strike-shared-anchor-v1.png`로 저장한다.
3. 무기·충격 모티프의 가독성, 손그림 2D 다크판타지 톤, 작은 카드 크기에서의 실루엣을 사용자에게 확인받는다.
4. 승인 전에는 `assets/game/cards/strike.png`로 승격하지 않는다.
5. 앵커 승인 후 나머지 공용 카드 프롬프트를 같은 스타일로 확장한다. MVP 규모는 캐릭터 수를 곱하지 않은 카드 ID 기준 12~16장이다.

카드 이미지는 다른 캐릭터 이미지 일괄 제작 단계에서 함께 만든다. 현재 게임 제작 우선순위에서 제외하며, 플레이스홀더를 유지한다.

### 2026-06-28 사용자 설계 교정

- `GAME_DESIGN.md` 9절대로 22명은 종족 공용 카드풀을 사용한다. 공용 기본 카드를 캐릭터별로 다시 그리지 않는다.
- 잘못 생성된 지두두 중심 `strike` 후보는 `assets/review/cards/rejected/strike-jdd-character-specific-v1.png`로 폐기 보관했다.
- 코드의 `cardArtUrl(cardId)` 구조는 이미 공용 카드 ID 기준이므로 변경할 필요가 없다.

## 22. 최신 인수인계 — 자동 저장·이어하기 완료 (2026-06-28)

### 구현

- `src/game/run/runPersistence.ts`
  - 저장 키: `slay-the-monstarz.run`
  - 포맷: `saveVersion: 1`, ISO `savedAt`, `RunState(version: 1)`.
  - localStorage를 `RunStorage` 인터페이스로 감싸 테스트에서 메모리 저장소를 주입한다.
  - 잘못된 JSON·미지원 버전·차단된 저장소·알 수 없는 콘텐츠/노드·현재 노드와 불일치하는 임시 상태는 크래시 없이 무시한다.
- `src/game/run/RunEngine.ts`
  - `RunEngine.restore(content, snapshot)` 추가.
  - 시드로 지도를 다시 만든 뒤 카드·유물·노드·페이즈 일관성을 검증하고 배열/임시 상태를 깊은 복사한다.
- `src/ui/RunGame.tsx`
  - 시작 화면, 저장 요약, `이어하기`, 저장 덮어쓰기 2단계 확인.
  - 노드 진입과 모든 런 상태 변경 직후 자동 저장.
  - 전투 중에는 `RunState`를 변경하지 않아 새로고침 시 해당 전투 진입 상태로 재생성.
- `src/style.css`
  - 데스크톱·모바일 시작 화면과 저장 카드 스타일.

### 복원 규칙

- 지도·보상·휴식·이벤트·상점·보물·승패 화면은 마지막 저장 상태를 그대로 연다.
- 전투는 전투 도중 상태를 저장하지 않고 노드 진입 스냅샷을 유지한다. 새로고침하면 턴 1, 진입 HP·덱·유물·시드로 복원한다.
- 새 런은 기존 저장을 지우고 즉시 새 초기 상태를 저장한다.
- 버전이 다르거나 데이터가 손상되면 저장을 폐기하고 새 런 시작 화면을 제공한다.

### 검증

```powershell
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

- 전체 4파일 47개 통과. 신규 `runPersistence.test.ts` 7개.
- 브라우저: 시작 화면, 새 런, 저장 요약, 이어하기, 동일 층/HP 복원 확인.
- 브라우저 콘솔 경고·오류 0.
- 코드리뷰: **APPROVED WITH SUGGESTIONS**, 차단 이슈 없음.
- 기존 Pixi 주 청크 500 kB 초과 경고는 별도 최적화 후보.

### 다음 권장 묶음

1. ~~**일반 적 총 3종**~~ — 23절에서 완료.
2. **포션 2종**: 획득·보유·전투 사용·소모의 최소 규칙과 UI.
3. **공용 카드 12~16장 구성**: 우선 메커니즘·밸런스·보상 풀을 완성하고 이미지는 보류한다.

## 23. 최신 인수인계 — 일반 적 3종·1~2층 인카운터 분산 완료 (2026-06-28)

### 신규 일반 적

- P `sentinel_scout` / 부유 파수병: 기존 공격 8 ↔ 방어 6 교대형.
- T `wasteland_gunner` / 잔해 총잡이: HP 32.
  - `점사`: 피해 4×2.
  - `견제 사격`: 피해 5 + 약화 1.
  - `엄폐 재장전`: 방어도 7.
- Z `acid_stalker` / 산성 추적자: HP 34.
  - `산성 표식`: 피해 4 + 취약 2.
  - `관통 가시`: 피해 9. 직전 취약이 남아 있으면 실제 13.
  - `갑각 탈피`: 방어도 6.
- T/Z는 전용 이미지 제작 전까지 `texture: "scout"`로 승인된 파수병 모션을 임시 재사용한다. 신규 이미지·라이브 에셋 교체 없음.

### 지도 배치

- `src/game/run/actOne.ts`의 `ACT_ONE_NORMAL_ENCOUNTERS`가 P/T/Z 세 ID와 지도용 부대를 정의한다.
- 시드로 세 적을 셔플한 뒤 1층은 A/B, 2층은 B/C/A 순으로 배치한다.
- 현재 레인 연결(1층 lane 1→2층 lane 0·2, lane 3→2층 lane 2·4)에서는 어느 경로도 같은 적을 연속으로 만나지 않는다.
- 같은 시드는 같은 배치를 재현하며, 1·2층 전체에는 항상 세 적이 모두 포함된다.

### 검증

```powershell
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

- 전체 4파일 53개 통과. 신규 테스트 6개.
- 5개 시드(1/7/42/100/2026)에서 세 적 등장·연결 중복 없음 확인.
- 브라우저 지도에서 P/T/Z 라벨 확인.
- T 잔해 총잡이 전투 진입: HP 32, 첫 의도 `점사 4×2`, scout 모션 정상 렌더.
- 콘솔 경고·오류 0.
- 코드리뷰: **APPROVED WITH SUGGESTIONS**. 지도 레인 구조를 바꾸면 인카운터 배치 규칙과 연결 중복 테스트를 함께 갱신할 것.

### 다음 권장 묶음

1. ~~**포션 2종**~~ — 24절에서 완료.
2. **공용 카드 12~16장**: 이미지 없이 규칙·밸런스·보상 풀부터 완성.
3. **적 전용 이미지**: 다른 이미지 일괄 제작 단계까지 보류. 현재 `scout` 공유를 유지.

## 24. 최신 인수인계 — 포션 2종(전투 사용·소모) 완료 (2026-06-28)

### 구현

- `src/content/potions.ts`(신규): `PotionDef`/`PotionType`, `MAX_POTIONS = 2`, 포션 2종 — 화염병(공격, 적 피해 12)·활력 주사(스킬, 에너지 +2). `ACT_ONE_POTION_POOL`.
- `src/game/engine/types.ts`: `PotionAction`(damage/block/energy/draw/heal) 추가 — 렌더러 독립 원시 타입(유물 `BattleModifiers`와 같은 레이어링).
- `src/game/engine/BattleEngine.ts`: `usePotion(action): BattleEvent[]` — 전투 중 즉시 효과 적용, 킬이면 win 이벤트. 소모는 런 계층이 처리.
- `src/game/run/types.ts`: `RunState.potions: string[]`, `RunReward.potionId?`.
- `src/game/run/RunEngine.ts`: `completeBattle` 포션 드롭(엘리트 50%/일반 40%, **기존 보상 추첨 이후**라 재현성 무변경), `takeRewardPotion()`(빈 슬롯·상한), `removePotions(slots)`(전투 종료 시 소모, 내림차순). `restore`·초기화에 potions 반영.
- `src/game/run/runPersistence.ts`: `isRunState`에 potions 배열 검증. (restore가 미지 포션 ID·슬롯 상한 거부.)
- `src/ui/RunGame.tsx`: `usedPotionSlots` 세션 상태로 전투 중 사용 추적 → 전투 종료 시 `removePotions` 확정. 보상 화면 포션 제안(받기/슬롯 가득), `RunHeader` 보유 포션 칩, 전투 진입/이어하기/새 런마다 사용 슬롯 초기화.
- `src/ui/BattleScreen.tsx`: 우하단 포션 벨트(`onUsePotion(slot)` → 효과+연출), `potions`/`onUsePotion` props.
- `src/style.css`: 포션 칩(헤더)·전투 벨트·보상 제안 스타일.

### 저장/복원 규칙

- 전투 중에는 `RunState.potions`를 바꾸지 않는다. 새로고침 시 포션이 그대로 복원되고 전투는 1턴부터 재생성(§22 불변식 유지, 악용 불가).
- 포션 소모는 전투 종료(`finishBattle`) 시 `removePotions`로 확정 후 저장.
- 미지 포션 ID·슬롯 상한 초과 저장은 폐기(새 런 제공).

### 검증

```powershell
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

- 전체 4파일 **62개** 통과(신규 9: 엔진 포션 3 + 런 포션 5 + 저장 1).
- 브라우저: 시작 화면·새 런·지도(15노드, 4층 상점+엘리트 혼합 유지) 렌더, 콘솔 경고·오류 0.
- 빌드 통과(Pixi 주 청크 500kB 경고는 기존 최적화 후보, 이번 변경과 무관).
- 코드리뷰: **APPROVED WITH SUGGESTIONS**, 차단 이슈 없음. 제안: 무이벤트 포션(에너지/드로우/회복) 화면 피드백 추가, 포션 아이콘 이모지 임시.
- 신규 이미지 생성·라이브 에셋 교체·외부 배포 없음.

### 다음 권장 묶음

1. ~~**공용 카드 12~16장**~~ — 25절에서 완료(14종).
2. **무이벤트 포션 전투 피드백**: 에너지/드로우/회복 사용 시 토스트·플래시.
3. **적/포션 전용 이미지**: 이미지 일괄 제작 단계까지 보류, 현재 임시 텍스처·이모지 유지.

## 25. 최신 인수인계 — 공용 카드 14종 + 보상·상점 풀 확충 완료 (2026-06-28)

### 구현

- `src/content/battleContent.ts`: 기본 카드 9 → **14종**으로 확충(신규 5). 엔진 효과 어휘(`damage`/`block`/`applyStatus`) 내에서 역할 분배:
  - `bash` 강타(공격 c2): 피해 9 + 적 취약 2 — 셋업 강타.
  - `flurry` 난사(공격 c1): 피해 2×3 — 저비용 다단(취약 시너지).
  - `aimedshot` 정조준(공격 c1): 피해 8 — 효율 단발.
  - `shieldwall` 방벽(스킬 c2): 방어도 14 — 대형 방어.
  - `pin` 결박 사격(스킬 c1): 적 취약 1 + 약화 1 — 제어형.
  - 기존 `+` 자동 강화 루프가 신규 카드의 강화본도 생성(총 28종).
- `src/game/run/actOne.ts`: `ACT_ONE_CARD_POOL`(드래프트 가능 12종, 기본 strike/guard 제외) 신설. `ACT_ONE_REWARD_POOL`·`ACT_ONE_SHOP_POOL`이 이를 공유 → 보상 3중1·상점 4종 진열 다양성 확보.
- 렌더 변경 없음: `RewardCard`/상점/휴식 강화/손패가 이미 임의 카드를 표시하므로 데이터만 추가.

### 설계 메모

- 엔진 카드 효과는 `damage`/`block`/`applyStatus`만 지원(파워·소멸·드로우·에너지 카드 효과 미구현). 신규 카드도 이 범위 내. 향후 카드 메커니즘 확장 시 `Effect` 유니온부터 늘려야 함(GAME_DESIGN §6의 파워/저주/중립은 별도 묶음).
- 종족(P/T/Z) 공용 풀 분리는 아직 미적용(현재 단일 캐릭터 jdd=T). GAME_DESIGN §9의 종족별 풀은 캐릭터 확장 단계에서 도입.
- 밸런스는 초안: aimedshot(c1 피해8)이 strike(c1 피해6)보다 효율↑ — 드래프트 보상 카드로 의도. 추후 `/balance-check`로 정밀 조정 여지.

### 검증

```powershell
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

- 전체 **5파일 68개** 통과(신규 `src/content/battleContent.test.ts` 6개: 기본 12~16종, 모든 카드 + 변형, 강화 수치 상승, 신규 카드 풀 포함, 풀 유효성, 기본 카드 풀 제외).
- 브라우저: 저장된 진행 중 엘리트 전투(정예 파수병) 정상 렌더, 손패·에너지·턴 종료 동작, 콘솔 오류 0. (카드 추가는 데이터 변경이라 기존 렌더 경로가 그대로 표시.)
- 빌드 통과(Pixi 청크 경고는 기존 후보, 무관).
- 신규 이미지 생성·라이브 에셋 교체·외부 배포 없음.

### 다음 권장 묶음

1. **무이벤트 포션 전투 피드백**: 에너지/드로우/회복 사용 시 토스트·플래시.
2. ~~**카드 메커니즘 확장**~~ — 26절에서 완료(드로우·에너지·힘·소멸).
3. **밸런스 패스**: `/balance-check`로 카드·적·보상 수치 정밀화.
4. **적/카드/포션 전용 이미지**: 이미지 일괄 제작 단계까지 보류.

## 26. 최신 인수인계 — 카드 메커니즘 확장(드로우·에너지·힘·소멸) 완료 (2026-06-28)

### 구현

- `src/game/engine/types.ts`:
  - `Effect`에 `{kind:"draw";amount}`·`{kind:"energy";amount}` 추가.
  - `StatusKind`에 `strength`(지속 파워, 매 턴 감소 안 함) 추가.
  - `CardDef.exhaust?: boolean`(사용 시 소멸 더미로), `PlayerState.exhaustPile` 추가.
- `src/game/engine/BattleEngine.ts`:
  - `scaleOutgoing`이 `strength`를 피해에 가산(타격마다 적용 → 다단 시너지), 이후 weak 적용, 0 하한.
  - `PERSISTENT_STATUSES = {strength}`를 `tickStatuses`에서 건너뛰어 파워가 지속.
  - `applyEffects`에 draw/energy 처리(플레이어 소스 한정).
  - `playCard`가 `def.exhaust`면 discard 대신 `exhaustPile`로 보냄.
  - 생성자 `exhaustPile: []` 초기화.
- `src/content/battleContent.ts`: 신규 카드 2종 → 기본 **16종**.
  - `adrenaline` 아드레날린(스킬 c0, 소멸): 에너지 +1 · 카드 2장 뽑기. (에너지+드로우+소멸 시연)
  - `empower` 전투 함성(스킬 c1): 힘 +2. (파워 시연)
  - `STATUS_LABEL.strength="힘"`, `describeEffects`가 draw/energy/strength 처리, 강화 루프가 exhaust 카드 설명에 `· 소멸` 부가.
- `src/game/run/actOne.ts`: `ACT_ONE_CARD_POOL`에 adrenaline·empower 추가(드래프트 14종).
- `src/ui/BattleScreen.tsx`: `STATUS_LABEL.strength="힘"`(힘 칩 표시), 손패 카드 `소멸` 배지, piles에 `소멸 N` 표시.
- `src/style.css`: `.exhaust-badge`.

### 설계 메모

- 엔진 효과 어휘가 damage/block/applyStatus/**draw/energy** + 파워(strength)/**소멸(카드 플래그)**로 확장됨. 이제 자원순환·스케일링·1회용 강카드 설계 가능.
- 소멸·힘은 전투 한정 상태라 `RunState`/저장에 영향 없음(전투는 노드 진입 스냅샷에서 재생성).
- 향후: 저주·중립 카드 유형(§6), 적 파워 사용, 추가 파워(민첩 등)는 별도 묶음.

### 검증

```powershell
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

- 전체 **5파일 71개** 통과(신규 3: 엔진 아드레날린(에너지·드로우·소멸)·empower 힘(다단 가산·지속) 2, 콘텐츠 소멸 강화본 1).
- 브라우저: 시작→이어하기(지도)→전투 진입(부유 파수병, 손패 5·piles 정상) 렌더, 확장 엔진(exhaustPile/strength) 정상 구성, 콘솔 오류 0.
- 빌드 통과(Pixi 청크 경고 기존 후보, 무관).
- 신규 이미지 생성·라이브 에셋 교체·외부 배포 없음.

### 다음 권장 묶음

1. **신규 메커니즘 활용 카드 확충**: 드로우/에너지/힘/소멸 조합 카드(단, 기본 카드 16종 상한 — 종족별 풀 분리 또는 상한 재조정 선행).
2. ~~**밸런스 패스**~~ — 27절에서 1차 완료.
3. **무이벤트 포션 전투 피드백**, 적 파워 패턴, 카드 유형 확장(저주·중립).

## 27. 최신 인수인계 — 1차 밸런스 패스(`/balance-check`) 완료 (2026-06-28)

### 분석

- `/balance-check`(전투+경제). 대상: `battleContent.ts`(카드16·적5)·`RunEngine.ts`(골드·상점)·`actOne.ts`(풀) vs `GAME_DESIGN.md` §6·7·10.
- 결과: **CONCERNS** — 치명 없음, 명확한 설계 이탈 1 + 효율 이상치 1. 전체 리포트는 `design/balance/balance-check-combat-2026-06-28.md`.

### 적용한 수정

1. **일반전 골드** `RunEngine.completeBattle`: `12+int(9)`(12~20) → `18+int(11)`(18~28). GAME_DESIGN §10 일치. (엘리트 35~45는 기존 유지.)
2. **aimedshot 정조준** `battleContent.ts`: 피해 8 → 7. 단발 효율 이상치(8/에너지, 타격·중사격 무손익 상위호환) 완화. 설계 기둥 "카드 선택엔 분명한 손익" 보존.

### 검증

- typecheck·test(5파일 **71개**)·build 통과. 두 수정 모두 정확값 단언 테스트 없어 안전(골드 테스트는 상대 단언).
- 값 조정이라 브라우저 추가 검증 불필요(앱 렌더는 26절에서 확인).

### 남은 밸런스/콘텐츠 갭(별도 묶음)

- 상점 가격이 **에너지 비용 기반**(설계 §10은 **희귀도 기반**) → 카드 `rarity` 필드 도입 후 재설계.
- 상점이 카드만 진열(설계: 카드4·유물2·포션2) → 상점 유물·포션 진열 확장.
- 카드 제거 가격 고정 75(설계 +25씩 증가) — 현재 노드당 1회라 영향 적음.

### 다음 권장 묶음

1. ~~**상점 희귀도/진열 확장**~~ — 28절에서 완료.
2. **신규 메커니즘 카드 확충**: 종족별 풀 분리/상한 재조정 선행.
3. **무이벤트 포션 전투 피드백** / 적 파워 패턴 / 카드 유형(저주·중립).

## 28. 최신 인수인계 — 희귀도 기반 혼합 상점(카드4·유물2·포션2) 완료 (2026-06-28)

### 구현

- `src/game/engine/types.ts`
  - `CardRarity = "common" | "uncommon" | "rare"`.
  - `CardDef.rarity` 필수 필드.
- `src/content/battleContent.ts`
  - 기본 카드 16종에 희귀도 지정. 강화본은 기존 spread 생성으로 기본 카드 희귀도를 자동 상속.
  - 일반: 시작 기본·단순 효율 카드, 고급: 제어·대형 방어·힘, 희귀: 아드레날린.
- `src/content/relics.ts`
  - `RelicRarity`에 `uncommon` 추가.
  - `stim_pack`(매 턴 추가 드로우)을 고급으로 재분류.
- `src/game/run/types.ts`
  - `ShopRelicItem`, `ShopPotionItem`.
  - `ActiveShop.relicItems?`, `potionItems?`는 버전 1 구형 상점 저장 호환을 위해 선택 필드.
- `src/game/run/RunEngine.ts`
  - 카드 가격: 일반 40~60 / 고급 70~95 / 희귀 110~145.
  - 유물 가격: 일반 120~160 / 고급 170~220 / 희귀 230~280.
  - 포션 가격: 45~80.
  - `buildShop`: 카드 4, 미보유·비starter 유물 최대 2, 포션 2를 노드 시드로 결정.
  - `buyShopRelic`: 중복·골드 확인 → `gainRelic` 즉시 효과 → 차감·판매 처리.
  - `buyShopPotion`: 2슬롯·골드 확인 → 보유 배열 추가·차감·판매 처리.
  - restore에서 보상·상점 유물/포션 ID 검증과 혼합 진열 깊은 복사.
- `src/game/run/runPersistence.ts`
  - reward potion ID와 선택형 혼합 상점 배열 구조 검증.
  - 필드가 없는 기존 버전 1 상점 저장은 계속 허용.
- `src/ui/RunGame.tsx`, `src/style.css`
  - 카드 희귀도 라벨.
  - 유물·포션 소형 진열 카드, 희귀도 색상, 가격·판매·보유·슬롯 가득 상태.
  - 구매 후 자동 저장과 헤더 HUD 즉시 갱신.

### 검증

```powershell
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

- 전체 5파일 **77개** 통과(기존 71 + 신규 6).
- 신규/확장 테스트:
  - 모든 카드 희귀도·강화본 상속.
  - 4+2+2 진열과 희귀도별 가격 범위.
  - 유물 구매·즉시 획득·보유 유물 진열 제외.
  - 포션 구매·2슬롯 상한.
  - 카드/유물/포션 판매 상태 저장 왕복.
  - 혼합 진열 없는 구형 v1 상점 저장 호환, 미지 혼합 콘텐츠 거부.
- 브라우저 실제 진행: 1층 전투 → 보상 → 2층 전투 → 보상/포션 → 3층 이벤트 → 4층 상점.
  - 카드 4·유물 2·포션 2와 설계 가격 범위 렌더.
  - 화염병 60골드 구매 후 골드 128→68, 포션 2/2, 판매됨·나머지 구매 잠금·HUD 반영.
  - 콘솔 경고·오류 0.
- 코드리뷰: **APPROVED WITH SUGGESTIONS**, 차단 이슈 없음.
- Pixi 주 청크 500kB 경고는 기존 최적화 후보.

### 남은 경제·폴리시

1. 카드 제거 가격 `75(+25씩)`의 런 누적값. 현재 1막 상점은 한 번뿐이라 체감 영향 없음.
2. 에너지/드로우/회복 포션은 엔진 이벤트가 없어 전투 화면 즉시 피드백이 약함.
3. 카드·유물·포션 아이콘/아트는 사용자 결정대로 이미지 일괄 제작 단계까지 보류.

### 다음 권장 묶음

1. **무이벤트 포션 전투 피드백**: 에너지/드로우/회복 사용 시 토스트·플래시.
2. **런 덱 보기 UI**: 현재 덱·강화·희귀도·소멸을 지도/비전투 화면에서 확인.
3. **1막 전체 플레이 밸런스 QA**: 시드별 HP·골드·상점 구매·보스 도달 기록.

## 29. 최신 인수인계 — 포션 전투 피드백·2막 전환 게이트 확정 (2026-06-28)

### 구현

- `src/game/engine/BattleEngine.ts`
  - `BattleEvent`에 `{ type: "potion"; effect: "energy" | "draw" | "heal"; amount }` 추가.
  - 에너지 포션은 증가량, 드로우·회복 포션은 실제 적용량을 이벤트로 반환한다.
  - 드로우 더미가 비었거나 최대 체력이어도 `amount: 0` 이벤트를 반환해 포션 사용 결과가 침묵하지 않는다.
- `src/ui/BattleScreen.tsx`
  - 포션 이벤트별 문구·아이콘을 1.1초 `role="status"` 토스트로 표시한다.
  - 기존 피해·방어 포션 연출 흐름은 유지한다.
  - 새 전투/언마운트 시 타이머를 정리한다.
- `src/style.css`
  - 에너지·드로우·회복별 색상의 캡슐 토스트와 방사형 플래시.
  - `prefers-reduced-motion`에서는 움직임만 제거하고 토스트 가시성은 유지한다.

### 검증

```powershell
npm.cmd run typecheck
npm.cmd test -- --run
npm.cmd run build
```

- 전체 5파일 **79개** 통과(기존 77 + 신규 2).
- 신규/확장 테스트:
  - 에너지 포션 이벤트와 턴 유지.
  - 드로우 포션의 실제 드로우 수.
  - 회복 포션의 최대 체력 상한과 0 회복 이벤트.
- 브라우저 실제 진행: 1층 전투 → 2층 전투/활력 주사 획득 → 3층 이벤트 → 4층 엘리트.
  - 활력 주사 사용 전후 에너지 3→5.
  - `에너지 +2` 상태 토스트와 플래시, 포션 버튼 제거 확인.
  - 콘솔 경고·오류 0.
- 코드리뷰: **APPROVED WITH SUGGESTIONS**, 차단 이슈 없음. 모션 감소 시 정적 토스트 유지 보정 완료.
- production build 통과. Pixi 주 청크 약 525kB 경고는 기존 비차단 최적화 후보.

### 2막 전환 판정

- 현재 판정: **CONDITIONAL GO**. 1막 기능 범위는 약 90%이며 이미지 일괄 제작은 2막 진입 조건이 아니다.
- 아래 두 작업을 순서대로 마치면 즉시 2막 제작으로 전환한다.
  1. **런 덱 보기 UI**: 지도·비전투 화면에서 현재 덱, 강화, 희귀도, 소멸 확인.
  2. **1막 풀런 밸런스 QA**: 복수 시드로 HP·골드·상점 구매·보스 도달을 기록하고 진행 차단 문제만 수정.
- 2막을 막지 않고 후순위로 둘 항목: 카드·적·포션 이미지, 오디오, 추가 포션 종류, 카드 제거 누적 가격, Pixi 코드 스플리팅.

### 다음 권장 묶음

1. **런 덱 보기 UI**.
2. **1막 풀런 밸런스 QA**.
3. **2막 기반 제작 시작**: 지도 스키마 재사용 범위와 2막 적·이벤트·보스 최소 콘텐츠 정의.

## 30. 최신 인수인계 — 런 덱 보기 UI 완료 (2026-06-28)

### 구현

- `src/ui/deckView.ts`(신규)
  - `buildDeckView(deck, cardDefs)` 순수 집계 함수.
  - 카드 ID별 중복 수량과 전체·종류·공격/스킬·강화·소멸 장수를 계산한다.
  - 공격→스킬, 희귀도, 이름 순으로 안정 정렬하며 미지 카드 ID는 안전하게 제외한다.
- `src/ui/RunGame.tsx`
  - 모든 비전투 화면이 공유하는 `RunHeader`의 덱 수치를 `덱 보기` 버튼으로 전환.
  - `DeckViewer` 모달에 비용·이름·설명·희귀도·강화·소멸·중복 수량 표시.
  - 닫기 버튼 최초 포커스, Tab 포커스 고정, Esc·배경·닫기 종료, 트리거 포커스 복귀.
- `src/style.css`
  - 카드 이미지에 의존하지 않는 2열 전술 목록과 요약 바.
  - 공격/스킬·희귀도·강화·소멸 색상, 내부 스크롤, 모바일 1열 대응.

### 저장·범위

- `RunState`와 저장 버전은 변경하지 않았다. 기존 v1 저장과 완전히 호환된다.
- 전투 화면은 손패 판단에 집중하도록 덱 모달을 추가하지 않았다.
- 지도·보상·휴식·이벤트·상점·보물·승패 화면에서는 같은 `RunHeader` 경로로 열 수 있다.
- 신규 이미지·라이브 에셋 교체·외부 배포 없음.

### 검증

```powershell
npm.cmd run typecheck
npm.cmd test -- --run
npm.cmd run build
```

- 전체 6파일 **82개** 통과(기존 79 + 신규 3).
- 신규 테스트:
  - 시작 덱 중복 집계와 10장·5종·공격 6/스킬 4 요약.
  - 강화 카드를 기본 카드와 분리하고 강화·소멸 복사 수 집계.
  - 미지 카드 ID 안전 처리.
- 브라우저: 저장된 4층 상점에서 `덱 보기 10` 버튼과 모달을 확인했다.
  - 전체 10·종류 5·공격/스킬 6/4·강화 0·소멸 0.
  - 타격 ×4, 방어 ×3, 나머지 ×1 및 일반/고급 희귀도.
  - Esc 닫기, `aria-expanded` 복귀, 콘솔 경고·오류 0.
- 코드리뷰: **APPROVED WITH SUGGESTIONS**, 차단 이슈 없음. 포커스 트랩과 오버스크롤 방지를 반영했다.
- production build의 Pixi 주 청크 약 528kB 경고는 기존 비차단 최적화 후보.

### 2막 전환 게이트

- 남은 게이트는 **1막 풀런 밸런스 QA 1개**다.
- 복수 시드로 HP·골드·상점 구매·덱 크기·보스 도달/승패를 기록하고 진행 차단 문제만 수정한다.
- QA 통과 직후 **2막 기반 제작**으로 전환한다. 이미지 일괄 제작은 여전히 전환 조건이 아니다.

### 다음 권장 묶음

1. ~~**1막 전체 플레이 밸런스 QA**~~ — 31절에서 완료(GO).
2. **2막 기반 설계·구현 시작**.

## 31. 최신 인수인계 — 1막 풀런 밸런스 QA 완료 → 2막 게이트 GO (2026-06-28)

### 작업

- `src/game/run/actOneFullRun.test.ts`(신규): 결정론 1막 풀런 시뮬레이터. 실제 `RunEngine`+`BattleEngine`을 그대로 구동해 지도→전투→보상→…→보스까지 자동 완주.
- 전투 오토플레이: 위험 시 방어 → 최대 피해 → 보조 스킬. 보상=공/방 우선·포션 수령, 휴식=HP<60% 회복/아니면 강화, 상점=최저가 카드+여유 유물, 이벤트/보물=첫 선택.
- 시드 8종 × 경로 2종(safe=상점/risky=엘리트) = **16런**. 리포트: `design/balance/act1-fullrun-qa-2026-06-28.md`.

### 결과 — PASS / 게이트 GO

- **승률 16/16**(safe 8/8, risky 8/8). 보스 도달 100%. 데드락·예외·골드 음수 0. 보스전 ≤13턴.
- 다수 시드가 한 자릿수 HP로 종료(2·3·6·8·9) → 보스 충분히 위협적, 적정 난이도.
- 검증: typecheck·test(7파일 **86개**, 신규 QA 4)·build 통과.

### 관찰(블로커 아님 — 2막에서 처리)

- **엘리트 경로 골드 소비처 부재**: 1막 상점은 4층뿐인데 4층 {상점,엘리트} 배타 선택이라 엘리트를 타면 상점이 없어 골드(115~196)가 남는다. → **2막에 골드 이월** + 2막 상점으로 자연 해소.
- 유능 오토플레이 승률 100%는 MVP 1막 목표("이길 수 있어야 함")에 부합. 실제 신규 플레이어 체감 난이도는 수동 플레이테스트 권장(자동 판정 아님).

### 다음 묶음 — 2막 기반 제작

- 다막 프레임워크: `RunState.act`를 1막 고정에서 일반화, 막 보스 처치 시 다음 막 지도로 전환(마지막 막 보스만 `won`). **골드·덱·유물·포션·HP를 막 사이 유지.**
- 2막 콘텐츠: 2막 지도(`createActTwoMap`), 2막 일반 적·엘리트, **2막 보스**(GAME_DESIGN §11: P 아칸 "공명 집행체" 또는 Z 울트라 "심연의 돌격수").
- 저장 스키마 `act` 일반화(현재 `act:1` 고정·`restore`가 act!==1 거부 → 다막 허용, 버전 호환 유지).
- **Act 1 맵 생성·테스트는 건드리지 말 것**(RunEngine 44개·풀런 QA가 1막 구조에 의존). 2막은 가산식으로 추가.

## 32. 최신 인수인계 — 다막 프레임워크 + 2막 구현 완료 (2026-06-28)

### 다막 프레임워크 (Act 1 생성/테스트 불변 유지)

- `types.ts`: `ActNumber = 1 | 2`, `FINAL_ACT = 2`, `RunState.act: ActNumber`.
- `RunEngine`:
  - `nodes`를 가변으로 바꿔 막 전환 시 교체. `createActMap(act, seed)` 디스패치(1막은 `createActOneMap` 그대로).
  - `completeBattle` 보스 분기: `act < FINAL_ACT`면 `advanceAct()`, 아니면 `won`.
  - `advanceAct()`: 다음 막 지도 생성, 진행·임시 상태 초기화, **HP·골드·덱·유물·포션 유지**, phase=map.
  - `restore`: act 1·2 허용, 저장된 막 지도로 재구성 후 검증.
  - **막 콘텐츠 시드 분리** `actSalt(act)=(act-1)*7919`를 battleSeed·보상·상점·보물·이벤트 시드에 가산. **1막은 +0이라 기존 결정성/QA 완전 보존.**
- `runPersistence.isRunState`: act 1·2 허용(버전 1 유지, 구형 저장 호환).

### 2막 콘텐츠

- `src/game/run/actTwo.ts`(신규): `createActTwoMap`(검증된 7층 골격 재사용, 2막 테마·ids `a2-`), `ACT_TWO_NORMAL_ENCOUNTERS`. 노드 연결 로직은 1막 불간섭 위해 의도적 복제(추후 통합 후보).
- `battleContent.ts` 2막 적 5종: P `void_stalker`(46), T `siege_marauder`(50, 과부하=힘+2), Z `chitin_brute`(52), 엘리트 P `resonance_warden`(72), **보스 Z `abyssal_charger` 심연의 돌격수**(165, 광폭화로 힘 누적→점증 위협). 전용 이미지 전까지 scout/queen 텍스처 임시 재사용.
- 카드/유물/포션 풀은 막 공용(별도 2막 풀 없음).
- `RunGame.tsx`: `ACT_THEME`로 헤더 막 라벨·지명·지도 제목·결과 문구를 막별로. 시작 화면 저장 요약도 막 표기.

### 검증

- typecheck·test(8파일 **92개**, 신규 actTwo 6)·build 통과. **1막 풀런 QA 여전히 8/8**(act salt=0로 1막 RNG 불변).
- 신규 테스트: 2막 지도 구조·ids·보스, 2막 적/보스 정의 완결, 막 전환 시 진행물 유지, 최종 막 보스만 승리, 2막 저장 왕복, 2막 전투 팩토리.
- 브라우저: 기존 저장 런(상점 화면) 정상 렌더, 헤더 "1막 황혼의 폐허" 막 인식, 콘솔 오류 0.
- 신규 이미지 생성·라이브 에셋 교체·외부 배포 없음.

### 관찰·다음

- 2막 보스/적 수치는 초안. **2막 풀런 밸런스 QA**(actOneFullRun을 다막으로 확장 또는 act2 전용)로 carried-over HP 기준 난이도 검증 권장.
- 1막 엘리트 경로 골드 잉여는 이제 2막으로 이월돼 2막 상점에서 소비 가능(이전 관찰 해소 경로 마련).
- 3막(GAME_DESIGN §11: P 캐리어/T 배틀크루저)은 `FINAL_ACT`·`ActNumber`·`createActMap`만 확장하면 가산 가능.
- 적/카드/포션 전용 이미지는 일괄 제작 단계까지 보류.

## 33. 최신 인수인계 — 2막 풀런 밸런스 QA 통과 + 밸런스 수정 (2026-06-28)

### 작업

- `src/game/run/actTwoFullRun.test.ts`(신규): 실제 `RunEngine`+`BattleEngine`을 그대로 구동하는 **다막(1막+2막) 풀런 시뮬레이터**. 1막 보스 처치 후 2막으로 전환해 최종 보스(심연의 돌격수)까지 전체 런 완주.
- 시드 8종 × 경로 2종(safe/risky) = **16런**. 전투 오토플레이에 **포션 사용 추가**(위급 시 화염병 처치/화력·활력 주사 에너지).
- 리포트: `design/balance/act2-fullrun-qa-2026-06-28.md`.

### 1차 결과 — FAIL (승률 2/16, safe 0/8)

- 이월 HP 극저(1막 종료 3~37, 다수 한 자릿수). 막 간 회복 없음.
- 2막 보스(HP 165, 광폭화 +3 힘/주기) 과강. safe 경로(유물 1~2)로 7~9턴 내 처치 불가.
- 2막 적 HP 46~52(1막 30~34 대비 +50~70%)로 누적 피해 치명적. 7/16 보스 도달 전 사망.

### 적용한 수정

1. **`RunEngine.advanceAct()`**: 막 전환 시 **최소 체력 50% 보장** — 현재 HP가 최대 HP의 절반 미만이면 절반까지 회복. 1막 RNG/QA 불변(act salt=0).
2. **2막 보스 심연의 돌격수**: HP 165→**140**, 심연 돌진 14→**13**, 광폭화 힘 +3→**+2**, 대지 강타 6×2→**5×2**.
3. **2막 적 HP**: 공허 추적자 46→**44**, 공성 약탈자 50→**46**, 키틴 야수 52→**48**, 공명 파수관(엘리트) 72→**64**.

### 2차 결과 — PASS (승률 14/16, safe 6/8, risky 8/8)

- 보스 도달 **16/16**. 데드락·예외·골드 음수 0. 보스전 ≤10턴.
- 다수 승리가 한 자릿수 HP(1·3·5·9·14·15·17·18)로 종료 → 적정 난이도.
- safe 2패(314·2026)는 보스 도달 후 사망 → 보스가 여전히 위협적(정상).
- **1막 엘리트 경로 골드 잉여 해소**: 1막 골드(115~196)가 2막으로 이월돼 2막 상점에서 소비(최종 골드 199~283).

### 검증

```powershell
npx vitest run src/game/run/actTwoFullRun.test.ts
npx vitest run
npx tsc -b --noEmit
npx vite build
```

- 전체 **9파일 98개** 통과(신규 act2 QA 6). **1막 풀런 QA 여전히 8/8**(act salt=0로 1막 RNG 불변).
- typecheck·build 통과(Pixi 청크 경고는 기존 비차단 후보).
- 신규 이미지 생성·라이브 에셋 교체·외부 배포 없음.

### 관찰·다음

- safe 6/8 vs risky 8/8 격차는 엘리트 보상(유물·골드)의 리스크·보상 구조 반영(의도됨).
- 1막 종료 HP가 대부분 35(50% 보장선): 1막 보스전 HP 소모가 큼. 향후 1막 보스 약화 또는 추가 휴식 기회로 개선 여지.
- **다음**: 3막 확장(`FINAL_ACT`·`ActNumber`·`createActMap` 가산, GAME_DESIGN §11: P 캐리어/T 배틀크루저) / 콘텐츠 폴리시(적 파워, 추가 포션/카드, 저주·중립 유형) / 이미지 일괄 제작.

## 34. 최신 인수인계 — 3막 확장 + 다막 풀런 QA 통과 (2026-06-28)

### 3막 프레임워크 (Act 1·2 생성/테스트 불변 유지)

- `types.ts`: `ActNumber = 1|2|3`, `FINAL_ACT = 3`.
- `RunEngine`: `createActMap` 3막 디스패치 추가, `restore`·`runPersistence.isRunState` act 3 허용(버전 1 유지, 구형 저장 호환).
- `completeBattle` 보스 분기 `act < FINAL_ACT(3)`가 자동 적용 → act 1·2 보스는 `advanceAct`, act 3 보스는 `won`.
- 막 콘텐츠 시드 분리 `actSalt(3)=(3-1)*7919=15838` → **1·2막 RNG/QA 완전 보존.**

### 3막 콘텐츠

- `src/game/run/actThree.ts`(신규): `createActThreeMap`(검증된 7층 골격, ids `a3-`, 3막 테마 "성간의 종말"), `ACT_THREE_NORMAL_ENCOUNTERS`.
- `battleContent.ts` 3막 적 5종(전용 이미지 전까지 scout/queen 텍스처 임시 재사용):
  - P `interceptor` 정밀 요격기(52): 정밀 타격 14 / 경화 보호막 14 교대.
  - T `fire_support` 화력 지원선(50): 맹렬 포격 6×2 / 무장 충전 힘+2 / 중포 12.
  - Z `abyssal_cluster` 심연 군집체(54): 부식 분사 8+취약2 / 군집 돌격 5×3 / 재생 갑각 10.
  - 엘리트 P `battleship_escort` 전함 호위대(72): 쌍관절 포화 8×2 / 중장갑 16 / 집행 타격 18.
  - **최종 보스 T `interstellar_battleship` 성간 전함**(150): 목표 고정 힘+1 / 양자 주포 16 / 중성자 갑판 14.
- 카드/유물/포션 풀은 막 공용(별도 3막 풀 없음).
- `RunGame.tsx`: `ACT_THEME[3]`(성간의 종말, 성간 전함을 향한 최종 결전). 승리 화면 "성간 전함을 쓰러뜨렸습니다".

### 밸런스 조정 (1차 FAIL → 조정 → PASS)

1차 다막 풀런 QA(승률 2/16)에서 3막 보스·적이 과강해 대부분 보스 도달 후 사망. 아래 수치 조정:

| 항목 | 1차 | 최종 |
|---|---|---|
| 성간 전함 HP | 180 | **150** |
| 양자 주포 피해 | 18 | **16** |
| 목표 고정 힘 | +2 | **+1** |
| 중성자 갑판 | 16 | **14** |
| 정밀 요격기 HP | 56 | **52** |
| 화력 지원선 HP | 54 | **50** |
| 심연 군집체 HP | 58 | **54** |
| 전함 호위대 HP | 80 | **72** |

### 검증

```powershell
npx vitest run src/game/run/actThree.test.ts
npx vitest run src/game/run/actTwoFullRun.test.ts
npx vitest run
npx tsc -b --noEmit
npx vite build
```

- 전체 **10파일 104개** 통과(신규 actThree 6 + 기존 98). **1막 QA 8/8·2막 QA 유지**(act salt 불변).
- 다막 풀런 QA(1+2+3막): 승률 **11/16**(safe 4/8·risky 7/8). 14/16 보스 도달(≥75%). 보스전 ≤13턴. 데드락·예외·골드 음수 0.
- typecheck·build 통과(Pixi 청크 경고는 기존 비차단 후보).
- 신규 이미지 생성·라이브 에셋 교체·외부 배포 없음.

### 관찰·다음

- 3막 난이도는 1·2막 대비 상승(의도): safe 4/8(50%)은 MVP "이길 수 있어야 함" 기준 충족. 2안전 패(314·2026)는 보스 도달 전 사망 → 3막 적이 약 빌드에는 벽.
- risky 7/8은 엘리트 보상(유물 5개)의 누적 효과. 골드 이월 경제 정상(최종 골드 245~398).
- **다음**: 콘텐츠 폴리시(적 파워 패턴, 추가 포션/카드 종류, 저주·중립 카드 유형) / 캐릭터 추가(§9 종족별 풀) / 이미지 일괄 제작(적·카드·포션 아트).

## 35. 최신 인수인계 — 개별 캐릭터·적 라이브 연동 (2026-06-30)

### 완료

- `assets/game/characters/`: 캐릭터 22종 개별 RGBA 텍스처.
- `assets/game/enemy-motion/`: 적 15종 개별 RGBA 텍스처.
- `BattleStage.ts`: 개별 에셋 로드, 캐릭터 종족별 공격 이펙트, 적별 모션·스케일·투사체 설정.
- `BattleScreen.tsx`: player/enemy texture, race, boss, act 전달. 상단 막 표시는 현재 act 사용.
- `battleContent.ts`: 캐릭터 22종·적 15종 texture ID를 각 엔티티 ID로 통일.
- `battleContent.test.ts`: 개별 texture 매핑 회귀 테스트 추가.
- `actOneFullRun.test.ts`: 막 전환 뒤 초기화되는 `completedNodeIds`를 고려해 층수 집계 수정.

### 런타임 정책

- `jdd`: 기존 25프레임 idle/attack 유지.
- 나머지 캐릭터 21종: 전용 정적 컷아웃 + 종족별 절차형 공격 모션.
- 1·2막 적 10종: 전용 6포즈 시트.
- 3막 적 5종: 전용 정적 컷아웃 + 절차형 공격 모션.

### 검증

- `npm.cmd run typecheck`: PASS.
- `npm.cmd run test`: **10파일 106개 PASS**.
- `npm.cmd run build`: PASS.
- 적 시트 규격 15/15 PASS, 라이브 PNG 알파·가장자리 검사 PASS.
- Codex 인앱 브라우저 세션 연결 오류로 자동 시각 스모크 테스트는 미실행. 실제 화면에서 크기·기준선·포즈 전환을 확인해야 한다.
- 외부 배포·Supabase·신규 Aether 생성 없음.

### 다음 게이트

1. 실제 화면에서 캐릭터·적 스케일과 발 기준선 승인.
2. 이상이 있으면 `BattleStage.ts`의 개별 `targetHeight`, `baseline`, `scale`만 조정.
3. 승인 후 사용자 확인을 받고 3막 적 5종의 6포즈 시트 제작으로 이동.

## 36. 최신 인수인계 — 전투 비주얼 QA·3막 6포즈 명세 (2026-06-30)

### 완료

- `src/ui/CombatVisualQa.tsx`: DEV 전용 전투 갤러리.
- 개발 서버에서 `/?combatQa=1&character=ample&enemy=abyssal_charger`처럼 조합을 직접 지정할 수 있다.
- 1막 실제 전투와 1·2·3막 대표 일반/보스 조합을 인앱 브라우저로 확인했다.
- 2막 시트는 336px 알파 폭 기준으로 보정하고, 가로형 3막 함선은 스케일 기준과 실제 세로 높이를 분리했다.
- 최종 스케일:
  - `abyssal_charger`: 600
  - `fire_support`: 360
  - `battleship_escort`: 420
  - `interstellar_battleship`: 650
- 공격 모션 재생 후 브라우저 콘솔 오류 0.
- `tools/act3_enemy_keypose_prompts.json`: 3막 적 5종 2열×3행 6포즈 생성 명세.
  5개 참조 마스터와 6포즈 구조 검증 PASS.

### 검증

- `npm.cmd run typecheck`: PASS.
- `npm.cmd run test`: 10파일 106개 PASS.
- `npm.cmd run build`: PASS.
- `python -m py_compile tools/keypose_board.py`: PASS.
- 신규 이미지 생성·외부 배포·Supabase 변경 없음.

### 다음

1. `tools/act3_enemy_keypose_prompts.json` 명세로 3막 5종 리뷰 보드를 생성한다.
2. `tools/keypose_board.py`로 30프레임 분리·크로마 제거·안전 여백 QA를 수행한다.
3. 리뷰 승인 전에는 `assets/game/enemy-motion/`을 덮어쓰지 않는다.

## 37. 최신 인수인계 — 시선 수정 5종 라이브 파일 정정 (2026-06-30)

- 대상: `ample`, `bright`, `fivehundred`, `jji`, `sample`.
- 원인: 구버전 `{id}_cutout_sheet.png`와 수정본 `{id}_sheet.png`가 같은 폴더에 공존했고,
  라이브 승격 스크립트가 구버전 이름을 사용했다.
- 수정본 `{id}_sheet.png` 5개를 `assets/game/characters/{id}.png`로 재승격했다.
- 교체 전 라이브 파일은 `assets/game/characters-backup/20260630-162250/`에 보존했다.
- 검증: 수정본 SHA-256 5/5 일치, 구버전 해시 5/5 불일치, 1024×1024 RGBA,
  알파 가장자리 접촉 0.
- 두 README에 수정본 파일명 우선순위를 명시했다.

## 38. 최신 인수인계 — 3막 적 5종 6포즈 리뷰 완료 (2026-06-30)

### 선택본

| 적 | 후보 | 자동 QA | 육안 QA |
|---|---|---|---|
| `interceptor` | `candidate-v2` | PASS | PASS |
| `fire_support` | `candidate-v1` | PASS | PASS |
| `abyssal_cluster` | `candidate-v2` | PASS | PASS |
| `battleship_escort` | `candidate-v1` | PASS | PASS |
| `interstellar_battleship` | `candidate-v1` | PASS | PASS |

- 경로: `assets/review/act3-enemy-motion-v1/`.
- 선택본 총 30프레임은 모두 `384×480` RGBA, 12px 안전 여백 이상,
  알파 가장자리 접촉 0.
- 평균 idle 알파 크기(폭×높이):
  - `interceptor`: 336×223
  - `fire_support`: 336×132
  - `abyssal_cluster`: 336×278.5
  - `battleship_escort`: 336×124
  - `interstellar_battleship`: 336×131.5
- `interceptor`는 v2에서 피격 포즈 중복 칼날을 제거했다.
- `abyssal_cluster`는 산성 색 보존을 위해 마젠타 크로마를 사용했고,
  v2에서 셀 경계 침범을 해결했다.
- 라이브 승격 완료. 이전 정적 파일 백업:
  `assets/game/enemy-motion-backup/20260630-172623/`.
- `BattleStage.ts`의 3막 5종은 2×3 키포즈 애니메이션과 336px 폭 기준
  스케일을 사용한다.
- typecheck PASS, 10파일 106테스트 PASS, production build PASS.

### 다음 게이트

1. `?combatQa=1`에서 3막 적 5종의 대기·공격·피격, 크기와 기준선을 확인한다.
2. 이상이 있으면 `targetHeight` 또는 `visualContentHeight`만 미세 조정한다.

## 39. 최신 인수인계 — 3막 적 5종 라이브 화면 QA 완료 (2026-06-30)

- `?combatQa=1`에서 3막 적 5종의 대기 화면과 공격 모션을 실제 재생했다.
- 원거리 4종의 투사체 시작점·경로, 심연 군집체의 근접 돌진,
  전함 호위대의 피격 전용 포즈·임팩트·피해 숫자 위치가 정상이다.
- 최종 보스 성간 전함은 화면 오른쪽 경계 안에서 보스 계층감을 유지한다.
- 5종 모두 잘림·셀 경계 혼입·기준선 이탈이 없었다.
- 추가 스케일 보정이나 코드 수정은 하지 않았다.
- 자동 검증은 직전 단계의 typecheck PASS, 106/106 테스트 PASS,
  production build PASS 상태를 유지한다.

### 다음

3막 적 모션 트랙은 종료됐다. 다음 묶음은 콘텐츠 폴리시 후보인
캐릭터별 시그니처 카드, 파워·저주·중립 카드 유형, 설정·일시정지,
오디오 중 하나를 선택해 진행한다.

## 40. 최신 인수인계 — 전투 방향·종족 공격 수정 (2026-06-30)

- `BattleStage.ts`:
  - 지두두 idle은 `idleFrameCount: 1`로 첫 프레임 고정.
  - P/Z 정적 캐릭터는 원거리 그래픽 대신 전진·회전 참격 애니메이션 사용.
  - T 정적 캐릭터와 지두두 공격은 기존 총격 방식 유지.
  - `wasteland_gunner`에 `flipX: true`를 적용하고 공격 펄스·사망 축소에서도
    반전 상태를 보존하도록 적 스케일 처리를 공통화.
- 실제 화면 QA:
  - 지두두가 시간 경과 후에도 같은 대기 프레임 유지.
  - P 청록/백색 참격과 Z 자주/녹색 참격이 캐릭터 앞에서 재생.
  - 잔해 총잡이가 대기·공격 중 모두 왼쪽을 바라봄.
  - 브라우저 오류·경고 0.
- 검증: typecheck PASS, 106/106 테스트 PASS, production build PASS.
- 에셋 PNG는 수정하지 않았고 Aether·Supabase·외부 배포도 실행하지 않았다.

## 41. 최신 인수인계 — 잔해 총잡이 좌향 시트 재제작 (2026-06-30)

- 40절의 런타임 반전 결과는 방향 판독이 부족해 최종안으로 사용하지 않는다.
- 승인 마스터를 참조해 실제 좌향 3/4 측면 6포즈 보드를 새로 제작했다.
- 리뷰/선택본:
  `assets/review/enemy-motion-v3/wasteland_gunner/candidate-v2/`.
- 자동 QA: 6/6 PASS, `384×480` RGBA, 최소 여백 24px, 가장자리 접촉 0.
- 라이브:
  `assets/game/enemy-motion/wasteland_gunner.png`.
- 교체 전 백업:
  `assets/game/enemy-motion-backup/20260630-213549/wasteland_gunner.png`.
- `BattleStage.ts`에서 임시 `flipX` 코드를 제거하고
  `visualContentHeight: 361`을 적용했다.
- 브라우저에서 대기와 공격 중 총열·바이저·몸통·다리 모두 왼쪽을 향하는
  것을 확인했다. 오류·경고 0.
- typecheck, 106/106 테스트, production build PASS.
- Supabase/CDN/외부 배포는 실행하지 않았다.

## 42. 최신 인수인계 — 캐릭터 22종 시그니처 카드 (2026-06-30)

### 구현

- `src/content/signatureCards.ts`
  - 캐릭터 22명 각각의 고유 카드 ID·이름·비용·효과를 정의했다.
  - 카드 ID는 `{characterId}_signature` 형식이다.
  - `starterDeckWithSignature()`가 종족 시작 덱의 `strike` 1장을 교체한다.
- `src/game/engine/types.ts`
  - `CardDef.signatureFor`, `CharacterDef.signatureCard`를 추가했다.
- `src/content/battleContent.ts`
  - 시그니처 카드 22장을 전체 카드 레지스트리에 합치고 모든 캐릭터 시작 덱에 연결했다.
- UI
  - 캐릭터 선택 카드에 `고유: {카드명}` 표시.
  - 전투 손패·덱 모달·휴식 강화 카드에 시그니처 배지와 금색 구분선 표시.
- 저장 호환
  - 기존 버전 1 저장에 고유 카드가 없으면 기본 `strike`를 교체한다.
  - `strike`가 없고 `strike+`가 있으면 고유 카드 `+`로 교체한다.
  - 둘 다 없을 때만 고유 카드를 덱에 추가한다.

### 정책

- 시그니처 카드는 보상·상점의 종족 공용 풀에 포함하지 않는다.
- 강화 카드는 기존 자동 `+` 생성 규칙을 사용한다.
- 신규 아트는 생성하지 않았다. 승인 전까지 타입별 플레이스홀더를 사용한다.
- 과거 폐기한 지두두 전용 `strike` 후보는 라이브로 승격하지 않았다.

### 검증

- `npm.cmd run typecheck`: PASS.
- `npm.cmd run test`: **10파일 110개 PASS**.
- `npm.cmd run build`: PASS. 기존 Pixi 주 청크 크기 경고만 유지.
- 브라우저 확인 과정에서 기존 저장 누락 문제를 발견해 마이그레이션 테스트를 추가했다.
  연결 재시도 중 브라우저 세션이 끊겨 최종 시각 검수는 미완료다.

### 다음

시그니처 카드 트랙은 코드 기준 완료됐다. 다음 콘텐츠 묶음은
파워·저주·중립 카드 유형 확장이다. 설정·일시정지 또는 오디오는 그 다음 후보로 둔다.

## 43. 최신 인수인계 — 파도튜브·진땅콩 로스터 삭제 (2026-07-01)

- 삭제 ID: `pado`, `peanut`.
- 제거 범위:
  - `battleContent.characters`
  - `SIGNATURE_CARD_ID_BY_CHARACTER`
  - `pado_signature`, `peanut_signature` 및 자동 강화 변형
  - `assets/game/characters/pado.png`, `peanut.png`
  - `tools/character_prompts.json`
  - `tools/character_regen_v2_batch_prompts.json`
  - 활성 캐릭터 마스터 프롬프트 로스터
- 활성 로스터는 T6·P5·Z9, 총 20명이다.
- 캐릭터 선택 화면과 `CombatVisualQa`는 캐릭터 레지스트리를 동적으로 읽으므로
  별도 UI 하드코딩 수정 없이 두 캐릭터가 사라진다.
- 삭제 캐릭터로 저장된 버전 1 런은 `loadRun()`에서 알 수 없는 캐릭터로
  판정되어 저장 슬롯을 안전하게 정리한다. 회귀 테스트를 추가했다.
- 과거 `assets/masters/`와 `assets/review/` 산출물은 런타임에서 사용하지 않는
  제작 기록으로 보존한다.
- 검증: typecheck PASS, 10파일 112테스트 PASS, production build PASS.
  빌드 모듈 820→818로 감소했고 두 캐릭터 PNG가 산출물에서 제거됐다.
