# 캐릭터 전투 마스터 v1 — QA·승인 기록 (2026-06-29)

- 상태: **사용자 승인 완료 → `assets/masters/{id}/{id}_master.png`로 승격.**
- 생성기: Gemini `gemini-2.5-flash-image`(Nano Banana), `tools/gen_images.py` + `tools/character_prompts.json`.
- 입력 2장 기법:
  1. **styleRef = `assets/review/style_anchor_armor.png`** — jdd 원화에서 **머리/얼굴을 잘라낸 갑옷 크롭**(그림체·질감·완성도·치비비율·#00ff00 배경 앵커, **얼굴 없음**).
  2. **ref = `assets/refs/{file}`** — 각 멤버 사진/카드(얼굴·헤어 정체성).
- 왜 크롭 앵커인가: 처음엔 jdd 원화 전체를 앵커로 써서 **모든 캐릭터에 jdd 얼굴이 복사**되는 버그 발생 → 앵커에서 얼굴 제거로 해결(얼굴=ref, 그림체=크롭).
- 종족별 갑옷 분리: P=매끈 흑요석·금 에너지기사 / T=녹슨 산업철갑+총 / Z=유기 키틴 외골격. (프롬프트 텍스트로 강제, jdd 갑옷 복사 금지.)

## 결과 (21명, jdd 별도 완료)
- 얼굴: 각 멤버 얼굴로 생성, jdd 얼굴 복사 없음(스팟체크: hyeonje·tyson·soulkey·calm·chamchi·fivehundred).
- 종족복: P 에너지 / T 산업 / Z 키틴 구분 확인.
- 그림체: jdd 앵커의 페인터리 거친 톤 일치, #00ff00 배경.

## 알려진 잔여(비차단)
- 일부 어깨에 jdd 등번호 **"07"**이 앵커에서 묻어남(멤버 번호 미정이라 유지). 추후 번호 제거/교체 가능.
- T 장발 멤버(예: fivehundred=500)는 같은 종족·헤어라 jdd와 외형이 유사(레퍼런스 충실, 버그 아님).

## 다음 단계 (이미지)
1. 각 마스터 **배경 크로마 제거** → 투명 스프라이트(`assets/game/`)로 게임 적용.
2. 캐릭터당 **키포즈 보드**(대기/공격/피격), `assets/review/enemy-motion-gpt-board-v1` 형식 + `tools/keypose_board.py`.
3. 코드 연동: 캐릭터 선택 화면 + `battleContent` 캐릭터 정의(현재 jdd만 플레이 가능).
