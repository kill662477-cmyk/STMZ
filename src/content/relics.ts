// 1막 유물 콘텐츠. 직렬화 가능한 데이터 정의로, RunEngine이 획득·전투 시작 효과를 적용한다.
// 효과 종류:
//   - maxHp        : 획득 즉시 최대 체력·현재 체력 증가(런 단위, 1회).
//   - combatEnergy : 매 턴 에너지 +N (baseEnergy 보정).
//   - combatBlock  : 전투 첫 턴 시작 시 방어도 +N.
//   - combatDraw   : 매 턴 추가 드로우 +N.
// 희귀도는 GAME_DESIGN §10 상점·보물 보상 가격대와 연계한다.
// 보물·엘리트 노드에서 보상으로 지급할 때 이 데이터를 사용한다(별도 묶음).

import type { BattleModifiers } from "../game/engine/types";

export type RelicRarity = "starter" | "common" | "uncommon" | "rare";

export type RelicEffect =
  | { kind: "maxHp"; amount: number }
  | { kind: "combatEnergy"; amount: number }
  | { kind: "combatBlock"; amount: number }
  | { kind: "combatDraw"; amount: number }
  | { kind: "combatStrength"; amount: number };

export interface RelicDef {
  id: string;
  name: string;
  rarity: RelicRarity;
  description: string;
  flavor?: string;
  effects: RelicEffect[];
}

export const RELICS: Record<string, RelicDef> = {
  reactor_core: {
    id: "reactor_core",
    name: "반응로 핵",
    rarity: "common",
    description: "매 턴 에너지 +1",
    flavor: "T 반응로 핵. 전장에서 활력을 끌어올린다.",
    effects: [{ kind: "combatEnergy", amount: 1 }],
  },
  carapace_plate: {
    id: "carapace_plate",
    name: "갑각 판",
    rarity: "common",
    description: "전투 시작 시 방어도 6",
    flavor: "Z 갑각 잔해. 첫 충격을 흡수한다.",
    effects: [{ kind: "combatBlock", amount: 6 }],
  },
  stim_pack: {
    id: "stim_pack",
    name: "전투 자극제",
    rarity: "uncommon",
    description: "매 턴 1장 추가 드로우",
    flavor: "T 자극제 잔여분. 반사신경을 끌어올린다.",
    effects: [{ kind: "combatDraw", amount: 1 }],
  },
  vital_implant: {
    id: "vital_implant",
    name: "생체 이식체",
    rarity: "rare",
    description: "최대 체력 +14, 즉시 14 회복",
    flavor: "P 칼라이 결정. 생명력을 북돋운다.",
    effects: [{ kind: "maxHp", amount: 14 }],
  },
  neosteel_frame: {
    id: "neosteel_frame",
    name: "네오스틸 골조",
    rarity: "rare",
    description: "전투 시작 시 방어도 4 · 매 턴 1장 추가 드로우",
    flavor: "T 네오스틸 골조. 견고함과 기민함을 함께.",
    effects: [
      { kind: "combatBlock", amount: 4 },
      { kind: "combatDraw", amount: 1 },
    ],
  },
  plasma_shield: {
    id: "plasma_shield",
    name: "플라즈마 보호막",
    rarity: "uncommon",
    description: "전투 시작 시 방어도 10",
    flavor: "P 플라즈마 보호막. 첫 교전을 완벽히 막아낸다.",
    effects: [{ kind: "combatBlock", amount: 10 }],
  },
  energy_cell: {
    id: "energy_cell",
    name: "예비 에너지 셀",
    rarity: "common",
    description: "최대 체력 +6, 즉시 6 회복",
    flavor: "T 예비 셀. 작지만 든든한 보험.",
    effects: [{ kind: "maxHp", amount: 6 }],
  },
  focus_crystal: {
    id: "focus_crystal",
    name: "집중 결정",
    rarity: "rare",
    description: "매 턴 에너지 +1 · 매 턴 1장 추가 드로우",
    flavor: "P 칼라이 결정. 정신과 활력을 동시에 끌어올린다.",
    effects: [
      { kind: "combatEnergy", amount: 1 },
      { kind: "combatDraw", amount: 1 },
    ],
  },
  regen_chrysalis: {
    id: "regen_chrysalis",
    name: "재생 번데기",
    rarity: "common",
    description: "최대 체력 +8, 즉시 8 회복",
    flavor: "Z 생체 번데기. 조직을 재생시킨다.",
    effects: [{ kind: "maxHp", amount: 8 }],
  },
  neural_implant: {
    id: "neural_implant",
    name: "신경 임플란트",
    rarity: "rare",
    description: "매 턴 에너지 +2",
    flavor: "P 사이오닉 임플란트. 두뇌가 에너지를 직접 생성한다.",
    effects: [{ kind: "combatEnergy", amount: 2 }],
  },
  jdd_relic: { id: "jdd_relic", name: "JDD 엔진", rarity: "starter", description: "전투 시작 시 방어도 5", effects: [{ kind: "combatBlock", amount: 5 }] },
  chamchi_relic: { id: "chamchi_relic", name: "참치 캔", rarity: "starter", description: "최대 체력 +10", effects: [{ kind: "maxHp", amount: 10 }] },
  sun_relic: { id: "sun_relic", name: "태양의 조각", rarity: "starter", description: "전투 시작 시 힘 +1", effects: [{ kind: "combatStrength", amount: 1 }] },
  sample_relic: { id: "sample_relic", name: "샘플 튜브", rarity: "starter", description: "매 턴 에너지 +1", effects: [{ kind: "combatEnergy", amount: 1 }] },
  soongsil_relic: { id: "soongsil_relic", name: "숭실의 결의", rarity: "starter", description: "매 턴 1장 추가 드로우", effects: [{ kind: "combatDraw", amount: 1 }] },
  bobo_relic: { id: "bobo_relic", name: "보보의 지팡이", rarity: "starter", description: "전투 시작 시 방어도 4, 힘 +1", effects: [{ kind: "combatBlock", amount: 4 }, { kind: "combatStrength", amount: 1 }] },
  nara_relic: { id: "nara_relic", name: "나라의 눈", rarity: "starter", description: "매 턴 에너지 +1", effects: [{ kind: "combatEnergy", amount: 1 }] },
  malcha_relic: { id: "malcha_relic", name: "말차 가루", rarity: "starter", description: "최대 체력 +12", effects: [{ kind: "maxHp", amount: 12 }] },
  jam_relic: { id: "jam_relic", name: "잼 병", rarity: "starter", description: "전투 시작 시 방어도 7", effects: [{ kind: "combatBlock", amount: 7 }] },
  dorong_relic: { id: "dorong_relic", name: "도롱뇽 꼬리", rarity: "starter", description: "매 턴 1장 추가 드로우", effects: [{ kind: "combatDraw", amount: 1 }] },
  dino_relic: { id: "dino_relic", name: "디노 화석", rarity: "starter", description: "최대 체력 +15", effects: [{ kind: "maxHp", amount: 15 }] },
  kkocha_relic: { id: "kkocha_relic", name: "꽃차 향기", rarity: "starter", description: "전투 시작 시 힘 +1", effects: [{ kind: "combatStrength", amount: 1 }] },
  doldol_relic: { id: "doldol_relic", name: "돌돌이 롤러", rarity: "starter", description: "매 턴 1장 추가 드로우", effects: [{ kind: "combatDraw", amount: 1 }] },
  mongle_relic: { id: "mongle_relic", name: "몽글 구름", rarity: "starter", description: "전투 시작 시 방어도 8", effects: [{ kind: "combatBlock", amount: 8 }] },
  bori_relic: { id: "bori_relic", name: "보리 이삭", rarity: "starter", description: "매 턴 에너지 +1", effects: [{ kind: "combatEnergy", amount: 1 }] },
  ample_relic: { id: "ample_relic", name: "충분한 양분", rarity: "starter", description: "최대 체력 +10", effects: [{ kind: "maxHp", amount: 10 }] },
  fivehundred_relic: { id: "fivehundred_relic", name: "500원 동전", rarity: "starter", description: "전투 시작 시 방어도 5", effects: [{ kind: "combatBlock", amount: 5 }] },
  hyeonje_relic: { id: "hyeonje_relic", name: "현재의 시계", rarity: "starter", description: "매 턴 에너지 +1", effects: [{ kind: "combatEnergy", amount: 1 }] },
  tyson_relic: { id: "tyson_relic", name: "타이슨 글러브", rarity: "starter", description: "전투 시작 시 힘 +1", effects: [{ kind: "combatStrength", amount: 1 }] },
  chu_relic: { id: "chu_relic", name: "츄츄 캔디", rarity: "starter", description: "매 턴 1장 추가 드로우", effects: [{ kind: "combatDraw", amount: 1 }] },
  rang_relic: { id: "rang_relic", name: "랑랑 탬버린", rarity: "starter", description: "최대 체력 +12", effects: [{ kind: "maxHp", amount: 12 }] },
  song_relic: { id: "song_relic", name: "송곳니", rarity: "starter", description: "전투 시작 시 힘 +1", effects: [{ kind: "combatStrength", amount: 1 }] },
  soulkey_relic: { id: "soulkey_relic", name: "영혼의 열쇠", rarity: "starter", description: "매 턴 에너지 +1", effects: [{ kind: "combatEnergy", amount: 1 }] },
  calm_relic: { id: "calm_relic", name: "평온의 향", rarity: "starter", description: "전투 시작 시 방어도 8", effects: [{ kind: "combatBlock", amount: 8 }] },
  killer_relic: { id: "killer_relic", name: "살수 본능", rarity: "starter", description: "매 턴 1장 추가 드로우", effects: [{ kind: "combatDraw", amount: 1 }] },
  hm_relic: { id: "hm_relic", name: "HM 마스크", rarity: "starter", description: "최대 체력 +15", effects: [{ kind: "maxHp", amount: 15 }] },
  seventytwo_relic: { id: "seventytwo_relic", name: "72번 티켓", rarity: "starter", description: "매 턴 에너지 +1", effects: [{ kind: "combatEnergy", amount: 1 }] },
  zoe_relic: { id: "zoe_relic", name: "조이풀 링", rarity: "starter", description: "전투 시작 시 방어도 6", effects: [{ kind: "combatBlock", amount: 6 }] },
  bright_relic: { id: "bright_relic", name: "빛나는 전구", rarity: "starter", description: "전투 시작 시 힘 +1", effects: [{ kind: "combatStrength", amount: 1 }] },
  jji_relic: { id: "jji_relic", name: "찌릿 전기", rarity: "starter", description: "매 턴 에너지 +1", effects: [{ kind: "combatEnergy", amount: 1 }] },
  nangni_relic: { id: "nangni_relic", name: "낭니 목걸이", rarity: "starter", description: "매 턴 1장 추가 드로우", effects: [{ kind: "combatDraw", amount: 1 }] },
};

export const ACT_ONE_RELIC_POOL = Object.keys(RELICS).filter(id => RELICS[id].rarity !== "starter");

export const NO_BATTLE_MODIFIERS: BattleModifiers = {
  combatEnergy: 0,
  combatBlock: 0,
  combatDraw: 0,
  combatStrength: 0,
};

// 보유 유물 목록에서 전투 수치 보정을 집계한다.
// maxHp 등 획득 시점 효과는 여기서 제외하고 RunEngine.gainRelic이 처리한다.
export function battleModifiersFor(relicIds: readonly string[]): BattleModifiers {
  const mods: BattleModifiers = { ...NO_BATTLE_MODIFIERS };
  for (const id of relicIds) {
    const relic = RELICS[id];
    if (!relic) continue;
    for (const effect of relic.effects) {
      if (effect.kind === "combatEnergy") mods.combatEnergy += effect.amount;
      else if (effect.kind === "combatBlock") mods.combatBlock += effect.amount;
      else if (effect.kind === "combatDraw") mods.combatDraw += effect.amount;
      else if (effect.kind === "combatStrength") mods.combatStrength += effect.amount;
    }
  }
  return mods;
}
