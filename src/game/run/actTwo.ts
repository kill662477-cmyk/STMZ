import { createInterleavedActMap } from "./actMap";
import type { RunNode } from "./types";

export const ACT_TWO_NORMAL_ENCOUNTERS = [
  { id: "void_stalker", subtitle: "P 공허 추적대" },
  { id: "siege_marauder", subtitle: "T 공성 약탈대" },
  { id: "chitin_brute", subtitle: "Z 키틴 무리" },
] as const;

const BATTLE_NAMES = [
  ["붕괴된 정거장", "공명 회랑"],
  ["균열의 틈", "부유 잔해", "침묵의 성소"],
  ["에너지 분기", "공허 통로", "공명 매복지"],
  ["뒤틀린 교차로", "공명 감시탑"],
  ["붕괴의 핵", "공명 방벽", "심연 협곡"],
] as const;

export function createActTwoMap(seed: number, ascension: number = 1): RunNode[] {
  return createInterleavedActMap(seed, {
    act: 2,
    seedSalt: 0x2b1d,
    normalEncounters: ACT_TWO_NORMAL_ENCOUNTERS,
    battleNames: BATTLE_NAMES,
    eventTitles: ["심연의 속삭임", "표류하는 잔해"],
    shopTitles: ["심연 상인", "공명 시장"],
    eliteTitle: "공명 파수관",
    eliteEncounterId: "resonance_warden",
    treasureTitles: ["봉인된 성소", "심연의 보고"],
    restTitles: ["공명의 안식처", "잔향의 쉼터"],
    bossTitle: "심연의 왕좌",
    bossSubtitle: "심연의 돌격수 · 막 보스",
    bossEncounterId: "abyssal_charger",
  }, ascension);
}
