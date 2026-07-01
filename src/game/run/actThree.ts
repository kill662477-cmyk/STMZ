import { createInterleavedActMap } from "./actMap";
import type { RunNode } from "./types";

export const ACT_THREE_NORMAL_ENCOUNTERS = [
  { id: "interceptor", subtitle: "P 정밀 요격대" },
  { id: "fire_support", subtitle: "T 화력 지원대" },
  { id: "abyssal_cluster", subtitle: "Z 심연 군집체" },
] as const;

const BATTLE_NAMES = [
  ["궤도 폐허", "차단된 관제탑"],
  ["소실된 함교", "잔해 벨트", "무력화된 포대"],
  ["차원 균열", "공허의 전초기지", "궤도 매복지"],
  ["전함 묘지", "과부하 반응로"],
  ["최종 방어선", "종말의 문", "항성 협곡"],
] as const;

export function createActThreeMap(seed: number, ascension: number = 1): RunNode[] {
  return createInterleavedActMap(seed, {
    act: 3,
    seedSalt: 0x3f7a,
    normalEncounters: ACT_THREE_NORMAL_ENCOUNTERS,
    battleNames: BATTLE_NAMES,
    eventTitles: ["성간 신호", "표류하는 잔해"],
    shopTitles: ["궤도 상인", "성간 시장"],
    eliteTitle: "전함 호위대",
    eliteEncounterId: "battleship_escort",
    treasureTitles: ["봉인된 무기고", "성간의 보고"],
    restTitles: ["항성의 안식처", "잔광의 쉼터"],
    bossTitle: "성간의 왕좌",
    bossSubtitle: "성간 전함 · 최종 보스",
    bossEncounterId: "interstellar_battleship",
  }, ascension);
}
