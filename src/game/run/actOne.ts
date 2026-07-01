import { createInterleavedActMap } from "./actMap";
import type { RunNode } from "./types";

// 전 막이 공유하는 카드 보상·상점 풀.
export const ACT_ONE_CARD_POOL = [
  "quickshot",
  "doubleshot",
  "heavyshot",
  "expose",
  "suppress",
  "bulwark",
  "volley",
  "bash",
  "flurry",
  "aimedshot",
  "shieldwall",
  "pin",
  "adrenaline",
  "empower",
];

export const ACT_ONE_REWARD_POOL = ACT_ONE_CARD_POOL;
export const ACT_ONE_SHOP_POOL = ACT_ONE_CARD_POOL;

export const ACT_ONE_NORMAL_ENCOUNTERS = [
  { id: "sentinel_scout", subtitle: "P 부유 정찰대" },
  { id: "wasteland_gunner", subtitle: "T 잔해 약탈대" },
  { id: "acid_stalker", subtitle: "Z 산성 사냥무리" },
] as const;

const BATTLE_NAMES = [
  ["무너진 초소", "황혼의 감시망"],
  ["공명 잔해", "끊어진 회랑", "부유 정찰선"],
  ["재의 통로", "침묵의 관문", "균열 매복지"],
  ["녹슨 분기점", "균열 감시소"],
  ["폐허의 심장", "황혼 방벽", "산성 협곡"],
] as const;

export function createActOneMap(seed: number, ascension: number = 1): RunNode[] {
  return createInterleavedActMap(seed, {
    act: 1,
    seedSalt: 0x51a7,
    normalEncounters: ACT_ONE_NORMAL_ENCOUNTERS,
    battleNames: BATTLE_NAMES,
    eventTitles: ["미지의 조우", "잔해 속 흔적"],
    shopTitles: ["밀매상의 좌판", "잔해 시장"],
    eliteTitle: "선봉 감시망",
    eliteEncounterId: "elite_sentinel",
    treasureTitles: ["봉인된 금고", "잊혀진 보물고"],
    restTitles: ["야영 모닥불", "잔불의 쉼터"],
    bossTitle: "군체의 왕좌",
    bossSubtitle: "군체 여왕 · 막 보스",
    bossEncounterId: "brood_queen",
  }, ascension);
}
