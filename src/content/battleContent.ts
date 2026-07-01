import type { BattleContent, CardDef, CharacterDef, Effect, EnemyDef } from "../game/engine/types";
import {
  SIGNATURE_CARDS,
  SIGNATURE_CARD_ID_BY_CHARACTER,
  starterDeckWithSignature,
} from "./signatureCards";

const cards: Record<string, CardDef> = {
  ...SIGNATURE_CARDS,
  strike: {
    id: "strike",
    name: "타격",
    type: "attack",
    rarity: "common",
    cost: 1,
    description: "피해 6",
    effects: [{ kind: "damage", amount: 6 }],
  },
  guard: {
    id: "guard",
    name: "방어",
    type: "skill",
    rarity: "common",
    cost: 1,
    description: "방어도 5",
    effects: [{ kind: "block", amount: 5 }],
  },
  doubleshot: {
    id: "doubleshot",
    name: "연사",
    type: "attack",
    rarity: "common",
    cost: 1,
    description: "피해 3 × 2",
    effects: [{ kind: "damage", amount: 3, hits: 2 }],
  },
  heavyshot: {
    id: "heavyshot",
    name: "중사격",
    type: "attack",
    rarity: "common",
    cost: 2,
    description: "피해 11",
    effects: [{ kind: "damage", amount: 11 }],
  },
  expose: {
    id: "expose",
    name: "약점 노출",
    type: "skill",
    rarity: "uncommon",
    cost: 1,
    description: "적에게 취약 2",
    effects: [{ kind: "applyStatus", status: "vulnerable", amount: 2, target: "enemy" }],
  },
  quickshot: {
    id: "quickshot",
    name: "속사",
    type: "attack",
    rarity: "common",
    cost: 0,
    description: "피해 3",
    effects: [{ kind: "damage", amount: 3 }],
  },
  suppress: {
    id: "suppress",
    name: "제압 사격",
    type: "attack",
    rarity: "uncommon",
    cost: 1,
    description: "피해 4 · 약화 2",
    effects: [
      { kind: "damage", amount: 4 },
      { kind: "applyStatus", status: "weak", amount: 2, target: "enemy" },
    ],
  },
  bulwark: {
    id: "bulwark",
    name: "철갑 진지",
    type: "skill",
    rarity: "common",
    cost: 1,
    description: "방어도 8",
    effects: [{ kind: "block", amount: 8 }],
  },
  volley: {
    id: "volley",
    name: "화망 전개",
    type: "attack",
    rarity: "uncommon",
    cost: 2,
    description: "피해 4 × 3",
    effects: [{ kind: "damage", amount: 4, hits: 3 }],
  },
  // --- 1막 공용 보상·상점 카드 확충(엔진 효과 어휘: damage/block/applyStatus 한정) ---
  // 셋업 강타: 피해 + 취약으로 후속 다단·강공격 증폭.
  bash: {
    id: "bash",
    name: "강타",
    type: "attack",
    rarity: "uncommon",
    cost: 2,
    description: "피해 9 · 적에게 취약 2",
    effects: [
      { kind: "damage", amount: 9 },
      { kind: "applyStatus", status: "vulnerable", amount: 2, target: "enemy" },
    ],
  },
  // 저비용 다단: 취약과 조합 시 효율 급상승.
  flurry: {
    id: "flurry",
    name: "난사",
    type: "attack",
    rarity: "common",
    cost: 1,
    description: "피해 2 × 3",
    effects: [{ kind: "damage", amount: 2, hits: 3 }],
  },
  // 효율 단일타: 기본 타격보다 높은 단발 피해(과효율 방지로 7).
  aimedshot: {
    id: "aimedshot",
    name: "정조준",
    type: "attack",
    rarity: "common",
    cost: 1,
    description: "피해 7",
    effects: [{ kind: "damage", amount: 7 }],
  },
  // 대형 방어: 보스 강공격 턴 대비.
  shieldwall: {
    id: "shieldwall",
    name: "방벽",
    type: "skill",
    rarity: "uncommon",
    cost: 2,
    description: "방어도 14",
    effects: [{ kind: "block", amount: 14 }],
  },
  // 제어형: 취약·약화 동시 부여로 받는 피해와 적 공격을 함께 누른다.
  pin: {
    id: "pin",
    name: "결박 사격",
    type: "skill",
    rarity: "uncommon",
    cost: 1,
    description: "적에게 취약 1 · 약화 1",
    effects: [
      { kind: "applyStatus", status: "vulnerable", amount: 1, target: "enemy" },
      { kind: "applyStatus", status: "weak", amount: 1, target: "enemy" },
    ],
  },
  // --- 확장 메커니즘 카드(에너지/드로우/힘/소멸) ---
  // 자원 순환: 비용 0으로 에너지·카드를 보충하지만 1회용(소멸).
  adrenaline: {
    id: "adrenaline",
    name: "아드레날린",
    type: "skill",
    rarity: "rare",
    cost: 0,
    description: "에너지 +1 · 카드 2장 뽑기 · 소멸",
    exhaust: true,
    effects: [
      { kind: "energy", amount: 1 },
      { kind: "draw", amount: 2 },
    ],
  },
  // 파워: 힘을 영구히 올려 모든 공격(특히 다단)의 피해를 키운다.
  empower: {
    id: "empower",
    name: "전투 함성",
    type: "skill",
    rarity: "uncommon",
    cost: 1,
    description: "힘 +2",
    effects: [{ kind: "applyStatus", status: "strength", amount: 2, target: "self" }],
  },
  // ===== P (프로토스) 종족 카드 — 에너지·보호막·정밀타격 (§8: 보호·충전) =====
  psiblade: {
    id: "psiblade", name: "사이블레이드", type: "attack", rarity: "common", cost: 1,
    description: "피해 7",
    effects: [{ kind: "damage", amount: 7 }],
  },
  warp_strike: {
    id: "warp_strike", name: "워프 강타", type: "attack", rarity: "uncommon", cost: 2,
    description: "피해 12",
    effects: [{ kind: "damage", amount: 12 }],
  },
  shield_charge: {
    id: "shield_charge", name: "보호막 충전", type: "skill", rarity: "common", cost: 1,
    description: "방어도 10",
    effects: [{ kind: "block", amount: 10 }],
  },
  focus: {
    id: "focus", name: "집중", type: "skill", rarity: "uncommon", cost: 1,
    description: "에너지 +2",
    effects: [{ kind: "energy", amount: 2 }],
  },
  phase_cannon: {
    id: "phase_cannon", name: "위상 포격", type: "attack", rarity: "uncommon", cost: 2,
    description: "피해 5 · 적에게 취약 2",
    effects: [
      { kind: "damage", amount: 5 },
      { kind: "applyStatus", status: "vulnerable", amount: 2, target: "enemy" },
    ],
  },
  refraction: {
    id: "refraction", name: "굴절장", type: "skill", rarity: "common", cost: 1,
    description: "적에게 약화 2 · 방어도 5",
    effects: [
      { kind: "applyStatus", status: "weak", amount: 2, target: "enemy" },
      { kind: "block", amount: 5 },
    ],
  },
  overcharge: {
    id: "overcharge", name: "과충전", type: "skill", rarity: "rare", cost: 0,
    description: "에너지 +2 · 카드 1장 뽑기 · 소멸",
    exhaust: true,
    effects: [
      { kind: "energy", amount: 2 },
      { kind: "draw", amount: 1 },
    ],
  },
  aegis: {
    id: "aegis", name: "이지스", type: "skill", rarity: "uncommon", cost: 2,
    description: "방어도 14",
    effects: [{ kind: "block", amount: 14 }],
  },
  mind_spike: {
    id: "mind_spike", name: "정신 찌르기", type: "attack", rarity: "common", cost: 1,
    description: "피해 4 · 카드 1장 뽑기",
    effects: [
      { kind: "damage", amount: 4 },
      { kind: "draw", amount: 1 },
    ],
  },
  resonance_field: {
    id: "resonance_field", name: "공명장", type: "skill", rarity: "rare", cost: 1,
    description: "방어도 6 · 힘 +1 · 적에게 취약 1",
    effects: [
      { kind: "block", amount: 6 },
      { kind: "applyStatus", status: "strength", amount: 1, target: "self" },
      { kind: "applyStatus", status: "vulnerable", amount: 1, target: "enemy" },
    ],
  },
  // ===== Z (저그) 종족 카드 — 다단·산성·증식 (§8: 증식·대가) =====
  spike_burst: {
    id: "spike_burst", name: "가시 분사", type: "attack", rarity: "common", cost: 1,
    description: "피해 3 × 3",
    effects: [{ kind: "damage", amount: 3, hits: 3 }],
  },
  acid_spray: {
    id: "acid_spray", name: "산성 분사", type: "attack", rarity: "common", cost: 1,
    description: "피해 3 · 적에게 취약 3",
    effects: [
      { kind: "damage", amount: 3 },
      { kind: "applyStatus", status: "vulnerable", amount: 3, target: "enemy" },
    ],
  },
  carapace: {
    id: "carapace", name: "갑각", type: "skill", rarity: "common", cost: 1,
    description: "방어도 7",
    effects: [{ kind: "block", amount: 7 }],
  },
  feral_claw: {
    id: "feral_claw", name: "야수 발톱", type: "attack", rarity: "common", cost: 1,
    description: "피해 5 × 2",
    effects: [{ kind: "damage", amount: 5, hits: 2 }],
  },
  metabolism: {
    id: "metabolism", name: "대사 촉진", type: "skill", rarity: "uncommon", cost: 0,
    description: "카드 2장 뽑기 · 소멸",
    exhaust: true,
    effects: [{ kind: "draw", amount: 2 }],
  },
  parasite: {
    id: "parasite", name: "기생 충격", type: "attack", rarity: "uncommon", cost: 2,
    description: "피해 6 · 적에게 약화 2",
    effects: [
      { kind: "damage", amount: 6 },
      { kind: "applyStatus", status: "weak", amount: 2, target: "enemy" },
    ],
  },
  spawn_brood: {
    id: "spawn_brood", name: "군체 생성", type: "skill", rarity: "uncommon", cost: 1,
    description: "방어도 5 · 카드 1장 뽑기",
    effects: [
      { kind: "block", amount: 5 },
      { kind: "draw", amount: 1 },
    ],
  },
  impale: {
    id: "impale", name: "관통", type: "attack", rarity: "uncommon", cost: 2,
    description: "피해 10 · 적에게 취약 1",
    effects: [
      { kind: "damage", amount: 10 },
      { kind: "applyStatus", status: "vulnerable", amount: 1, target: "enemy" },
    ],
  },
  swarm: {
    id: "swarm", name: "군집", type: "attack", rarity: "common", cost: 1,
    description: "피해 2 × 4",
    effects: [{ kind: "damage", amount: 2, hits: 4 }],
  },
  adaptive_regrowth: {
    id: "adaptive_regrowth", name: "적응 재생", type: "skill", rarity: "rare", cost: 1,
    description: "힘 +2 · 방어도 5",
    effects: [
      { kind: "applyStatus", status: "strength", amount: 2, target: "self" },
      { kind: "block", amount: 5 },
    ],
  },
  // Z 신규 상태이상 카드 (중독)
  venom_gland: {
    id: "venom_gland", name: "독액샘", type: "skill", rarity: "uncommon", cost: 1,
    description: "적에게 중독 5",
    effects: [{ kind: "applyStatus", status: "poison", amount: 5, target: "enemy" }],
  },
  toxic_spores: {
    id: "toxic_spores", name: "맹독 포자", type: "skill", rarity: "rare", cost: 1,
    description: "적에게 중독 7 · 방어도 4",
    effects: [
      { kind: "applyStatus", status: "poison", amount: 7, target: "enemy" },
      { kind: "block", amount: 4 },
    ],
  },
  // P 신규 상태이상 카드 (재생)
  shield_regen: {
    id: "shield_regen", name: "보호막 재생", type: "skill", rarity: "uncommon", cost: 1,
    description: "방어도 6 · 자신에게 재생 3",
    effects: [
      { kind: "block", amount: 6 },
      { kind: "applyStatus", status: "regen", amount: 3, target: "self" },
    ],
  },
  // 기절 (rare, 범용)
  flash_bang: {
    id: "flash_bang", name: "섬광탄", type: "skill", rarity: "rare", cost: 1,
    description: "적에게 기절 1 · 적에게 약화 2",
    effects: [
      { kind: "applyStatus", status: "stun", amount: 1, target: "enemy" },
      { kind: "applyStatus", status: "weak", amount: 2, target: "enemy" },
    ],
  },
};

// 종족별 시작덱 템플릿. 종족 카드풀 분리 전까지 공용 카드로 구성하되
// 종족 정체성(§8)을 암시하는 구성으로 차별화한다.
// T=공격적(중화기), P=방어적(보호막), Z=다공격(다단).
const T_STARTER = ["strike", "strike", "strike", "strike", "guard", "guard", "guard", "doubleshot", "heavyshot", "expose"];
const P_STARTER = ["strike", "strike", "strike", "guard", "guard", "guard", "guard", "psiblade", "shield_charge", "refraction"];
const Z_STARTER = ["strike", "strike", "strike", "strike", "guard", "guard", "guard", "spike_burst", "feral_claw", "acid_spray"];

const characters: Record<string, CharacterDef> = {
  // ===== T (테란) — 체력 높음, 시작유물 carapace_plate (첫턴 방어도 6) =====
  jdd: {
    id: "jdd", name: "지두두", race: "T", maxHp: 70, baseEnergy: 3,
    texture: "jdd", deck: starterDeckWithSignature(T_STARTER, "jdd"),
    signatureCard: SIGNATURE_CARD_ID_BY_CHARACTER.jdd, startingRelic: "jdd_relic",
  },
  chamchi: {
    id: "chamchi", name: "참치", race: "T", maxHp: 74, baseEnergy: 3,
    texture: "chamchi", deck: starterDeckWithSignature(T_STARTER, "chamchi"),
    signatureCard: SIGNATURE_CARD_ID_BY_CHARACTER.chamchi, startingRelic: "chamchi_relic",
  },
  sun: {
    id: "sun", name: "햇살", race: "T", maxHp: 70, baseEnergy: 3,
    texture: "sun", deck: starterDeckWithSignature(T_STARTER, "sun"),
    signatureCard: SIGNATURE_CARD_ID_BY_CHARACTER.sun, startingRelic: "sun_relic",
  },
  sample: {
    id: "sample", name: "소주양", race: "T", maxHp: 72, baseEnergy: 3,
    texture: "sample", deck: starterDeckWithSignature(T_STARTER, "sample"),
    signatureCard: SIGNATURE_CARD_ID_BY_CHARACTER.sample, startingRelic: "sample_relic",
  },
  ample: {
    id: "ample", name: "사테", race: "T", maxHp: 76, baseEnergy: 3,
    texture: "ample", deck: starterDeckWithSignature(T_STARTER, "ample"),
    signatureCard: SIGNATURE_CARD_ID_BY_CHARACTER.ample, startingRelic: "ample_relic",
  },
  fivehundred: {
    id: "fivehundred", name: "비타밍", race: "T", maxHp: 72, baseEnergy: 3,
    texture: "fivehundred", deck: starterDeckWithSignature(T_STARTER, "fivehundred"),
    signatureCard: SIGNATURE_CARD_ID_BY_CHARACTER.fivehundred, startingRelic: "fivehundred_relic",
  },
  // ===== P (프로토스) — 체력 낮음, 시작유물 reactor_core (매턴 에너지+1) =====
  hyeonje: {
    id: "hyeonje", name: "변현제", race: "P", maxHp: 66, baseEnergy: 3,
    texture: "hyeonje", deck: starterDeckWithSignature(P_STARTER, "hyeonje"),
    signatureCard: SIGNATURE_CARD_ID_BY_CHARACTER.hyeonje, startingRelic: "hyeonje_relic",
  },
  tyson: {
    id: "tyson", name: "박수범", race: "P", maxHp: 68, baseEnergy: 3,
    texture: "tyson", deck: starterDeckWithSignature(P_STARTER, "tyson"),
    signatureCard: SIGNATURE_CARD_ID_BY_CHARACTER.tyson, startingRelic: "tyson_relic",
  },
  chu: {
    id: "chu", name: "토마토", race: "P", maxHp: 70, baseEnergy: 3,
    texture: "chu", deck: starterDeckWithSignature(P_STARTER, "chu"),
    signatureCard: SIGNATURE_CARD_ID_BY_CHARACTER.chu, startingRelic: "chu_relic",
  },
  rang: {
    id: "rang", name: "Rang", race: "P", maxHp: 66, baseEnergy: 3,
    texture: "rang", deck: starterDeckWithSignature(P_STARTER, "rang"),
    signatureCard: SIGNATURE_CARD_ID_BY_CHARACTER.rang, startingRelic: "rang_relic",
  },
  song: {
    id: "song", name: "아리송이", race: "P", maxHp: 68, baseEnergy: 3,
    texture: "song", deck: starterDeckWithSignature(P_STARTER, "song"),
    signatureCard: SIGNATURE_CARD_ID_BY_CHARACTER.song, startingRelic: "song_relic",
  },
  // ===== Z (저그) — 중간 체력, 시작유물 stim_pack (매턴 드로우+1) =====
  soulkey: {
    id: "soulkey", name: "김민철", race: "Z", maxHp: 72, baseEnergy: 3,
    texture: "soulkey", deck: starterDeckWithSignature(Z_STARTER, "soulkey"),
    signatureCard: SIGNATURE_CARD_ID_BY_CHARACTER.soulkey, startingRelic: "soulkey_relic",
  },
  calm: {
    id: "calm", name: "김윤환", race: "Z", maxHp: 70, baseEnergy: 3,
    texture: "calm", deck: starterDeckWithSignature(Z_STARTER, "calm"),
    signatureCard: SIGNATURE_CARD_ID_BY_CHARACTER.calm, startingRelic: "calm_relic",
  },
  killer: {
    id: "killer", name: "박준오", race: "Z", maxHp: 68, baseEnergy: 3,
    texture: "killer", deck: starterDeckWithSignature(Z_STARTER, "killer"),
    signatureCard: SIGNATURE_CARD_ID_BY_CHARACTER.killer, startingRelic: "killer_relic",
  },
  hm: {
    id: "hm", name: "배성흠", race: "Z", maxHp: 74, baseEnergy: 3,
    texture: "hm", deck: starterDeckWithSignature(Z_STARTER, "hm"),
    signatureCard: SIGNATURE_CARD_ID_BY_CHARACTER.hm, startingRelic: "hm_relic",
  },
  seventytwo: {
    id: "seventytwo", name: "치리", race: "Z", maxHp: 70, baseEnergy: 3,
    texture: "seventytwo", deck: starterDeckWithSignature(Z_STARTER, "seventytwo"),
    signatureCard: SIGNATURE_CARD_ID_BY_CHARACTER.seventytwo, startingRelic: "seventytwo_relic",
  },
  zoe: {
    id: "zoe", name: "조이", race: "Z", maxHp: 66, baseEnergy: 3,
    texture: "zoe", deck: starterDeckWithSignature(Z_STARTER, "zoe"),
    signatureCard: SIGNATURE_CARD_ID_BY_CHARACTER.zoe, startingRelic: "zoe_relic",
  },
  bright: {
    id: "bright", name: "먼진", race: "Z", maxHp: 68, baseEnergy: 3,
    texture: "bright", deck: starterDeckWithSignature(Z_STARTER, "bright"),
    signatureCard: SIGNATURE_CARD_ID_BY_CHARACTER.bright, startingRelic: "bright_relic",
  },
  jji: {
    id: "jji", name: "찌킹", race: "Z", maxHp: 72, baseEnergy: 3,
    texture: "jji", deck: starterDeckWithSignature(Z_STARTER, "jji"),
    signatureCard: SIGNATURE_CARD_ID_BY_CHARACTER.jji, startingRelic: "jji_relic",
  },
  nangni: {
    id: "nangni", name: "낭니", race: "Z", maxHp: 70, baseEnergy: 3,
    texture: "nangni", deck: starterDeckWithSignature(Z_STARTER, "nangni"),
    signatureCard: SIGNATURE_CARD_ID_BY_CHARACTER.nangni, startingRelic: "nangni_relic",
  },
};

const enemies: Record<string, EnemyDef> = {
  sentinel_scout: {
    id: "sentinel_scout",
    name: "부유 파수병",
    subtitle: "P 정찰 모티브",
    maxHp: 45,
    tier: "normal",
    texture: "sentinel_scout",
    pattern: ["shot", "shield", "shot"],
    actions: {
      shot: {
        id: "shot",
        name: "정밀 사격",
        intent: "attack",
        description: "피해 12",
        effects: [{ kind: "damage", amount: 12 }],
      },
      shield: {
        id: "shield",
        name: "보호막",
        intent: "defend",
        description: "방어도 6",
        effects: [{ kind: "block", amount: 6 }],
      },
    },
  },
  // 신규 일반 적은 승인된 전용 6포즈 시트를 사용한다.
  // T: 다단 공격과 약화로 손패 운영을 압박하고, 재장전 턴에는 방어한다.
  wasteland_gunner: {
    id: "wasteland_gunner",
    name: "잔해 총잡이",
    subtitle: "T 해병·벌처 모티브",
    maxHp: 48,
    tier: "normal",
    texture: "wasteland_gunner",
    pattern: ["burstfire", "suppress", "reload", "burstfire"],
    actions: {
      burstfire: {
        id: "burstfire",
        name: "점사",
        intent: "attack",
        description: "피해 6 × 2",
        effects: [{ kind: "damage", amount: 6, hits: 2 }],
      },
      suppress: {
        id: "suppress",
        name: "견제 사격",
        intent: "debuff",
        description: "피해 8 + 약화 1",
        effects: [
          { kind: "damage", amount: 8 },
          { kind: "applyStatus", status: "weak", amount: 1, target: "enemy" },
        ],
      },
      reload: {
        id: "reload",
        name: "엄폐 재장전",
        intent: "defend",
        description: "방어도 7",
        effects: [{ kind: "block", amount: 7 }],
      },
    },
  },
  // Z: 먼저 취약을 새긴 뒤 강공격으로 증폭 피해를 노리는 예고형 패턴.
  acid_stalker: {
    id: "acid_stalker",
    name: "산성 추적자",
    subtitle: "Z 히드라·로치 모티브",
    maxHp: 51,
    tier: "normal",
    texture: "acid_stalker",
    pattern: ["acidmark", "spineshot", "molt", "spineshot"],
    actions: {
      acidmark: {
        id: "acidmark",
        name: "산성 표식",
        intent: "debuff",
        description: "피해 6 + 취약 2",
        effects: [
          { kind: "damage", amount: 6 },
          { kind: "applyStatus", status: "vulnerable", amount: 2, target: "enemy" },
        ],
      },
      spineshot: {
        id: "spineshot",
        name: "관통 가시",
        intent: "attack",
        description: "피해 14",
        effects: [{ kind: "damage", amount: 14 }],
      },
      molt: {
        id: "molt",
        name: "갑각 탈피",
        intent: "defend",
        description: "방어도 6",
        effects: [{ kind: "block", amount: 6 }],
      },
    },
  },
  brood_queen: {
    id: "brood_queen",
    name: "군체 여왕",
    subtitle: "Z 퀸 보스 모티브",
    maxHp: 180,
    tier: "boss",
    texture: "brood_queen",
    pattern: ["claw", "harden", "acidspray", "claw"],
    actions: {
      claw: {
        id: "claw",
        name: "갈퀴 강타",
        intent: "attack",
        description: "피해 17",
        effects: [{ kind: "damage", amount: 17 }],
      },
      harden: {
        id: "harden",
        name: "갑각 경화",
        intent: "defend",
        description: "방어도 12",
        effects: [{ kind: "block", amount: 12 }],
      },
      acidspray: {
        id: "acidspray",
        name: "산성 분사",
        intent: "debuff",
        description: "피해 11 + 약화 1",
        effects: [
          { kind: "damage", amount: 11 },
          { kind: "applyStatus", status: "weak", amount: 1, target: "enemy" },
        ],
      },
    },
  },
  // 엘리트 적. 승인된 전용 6포즈 시트를 사용한다.
  elite_sentinel: {
    id: "elite_sentinel",
    name: "정예 파수병",
    subtitle: "P 정예 정찰 모티브",
    maxHp: 69,
    tier: "normal",
    texture: "elite_sentinel",
    pattern: ["heavyshot", "bulwark", "suppressing", "heavyshot"],
    actions: {
      heavyshot: {
        id: "heavyshot",
        name: "집중 사격",
        intent: "attack",
        description: "피해 18",
        effects: [{ kind: "damage", amount: 18 }],
      },
      bulwark: {
        id: "bulwark",
        name: "강화 보호막",
        intent: "defend",
        description: "방어도 9",
        effects: [{ kind: "block", amount: 9 }],
      },
      suppressing: {
        id: "suppressing",
        name: "제압 탄막",
        intent: "debuff",
        description: "피해 8 × 2 + 약화 1",
        effects: [
          { kind: "damage", amount: 8, hits: 2 },
          { kind: "applyStatus", status: "weak", amount: 1, target: "enemy" },
        ],
      },
    },
  },
  // ===== 2막(공명하는 심연) 적. 승인된 전용 6포즈 시트 사용. =====
  // P: 강한 단일 공격과 보호막 교대(보호·충전 정체성).
  void_stalker: {
    id: "void_stalker",
    name: "공허 추적자",
    subtitle: "P 추적자 모티브",
    maxHp: 66,
    tier: "normal",
    texture: "void_stalker",
    pattern: ["phasestrike", "barrier", "phasestrike"],
    actions: {
      phasestrike: {
        id: "phasestrike",
        name: "위상 일격",
        intent: "attack",
        description: "피해 17",
        effects: [{ kind: "damage", amount: 17 }],
      },
      barrier: {
        id: "barrier",
        name: "공명 보호막",
        intent: "defend",
        description: "방어도 10",
        effects: [{ kind: "block", amount: 10 }],
      },
    },
  },
  // Z: 취약을 새기고 다단으로 압박(증식·대가 정체성).
  chitin_brute: {
    id: "chitin_brute",
    name: "키틴 야수",
    subtitle: "Z 야수 모티브",
    maxHp: 72,
    tier: "normal",
    texture: "chitin_brute",
    pattern: ["gore", "thrash", "molt", "gore"],
    actions: {
      gore: {
        id: "gore",
        name: "들이받기",
        intent: "debuff",
        description: "피해 11 + 취약 1",
        effects: [
          { kind: "damage", amount: 11 },
          { kind: "applyStatus", status: "vulnerable", amount: 1, target: "enemy" },
        ],
      },
      thrash: {
        id: "thrash",
        name: "난동",
        intent: "attack",
        description: "피해 6 × 2",
        effects: [{ kind: "damage", amount: 6, hits: 2 }],
      },
      molt: {
        id: "molt",
        name: "갑각 재생",
        intent: "defend",
        description: "방어도 8",
        effects: [{ kind: "block", amount: 8 }],
      },
    },
  },
  // T: 다단 + 자가 강화(힘)로 뒤로 갈수록 화력이 오른다(순환·화력 정체성).
  siege_marauder: {
    id: "siege_marauder",
    name: "공성 약탈자",
    subtitle: "T 공성 모티브",
    maxHp: 69,
    tier: "normal",
    texture: "siege_marauder",
    pattern: ["barrage", "overcharge", "heavyhit", "barrage"],
    actions: {
      barrage: {
        id: "barrage",
        name: "연발 포화",
        intent: "attack",
        description: "피해 8 × 2",
        effects: [{ kind: "damage", amount: 8, hits: 2 }],
      },
      overcharge: {
        id: "overcharge",
        name: "과부하",
        intent: "buff",
        description: "힘 +2",
        effects: [{ kind: "applyStatus", status: "strength", amount: 2, target: "self" }],
      },
      heavyhit: {
        id: "heavyhit",
        name: "중포 강타",
        intent: "attack",
        description: "피해 14",
        effects: [{ kind: "damage", amount: 14 }],
      },
    },
  },
  // 2막 엘리트(P): 다단 + 강타 + 견고한 방어.
  resonance_warden: {
    id: "resonance_warden",
    name: "공명 파수관",
    subtitle: "P 정예 집행 모티브",
    maxHp: 96,
    tier: "normal",
    texture: "resonance_warden",
    pattern: ["pulse", "fortify", "smite", "pulse"],
    actions: {
      pulse: {
        id: "pulse",
        name: "공명 파동",
        intent: "attack",
        description: "피해 11 × 2",
        effects: [{ kind: "damage", amount: 11, hits: 2 }],
      },
      fortify: {
        id: "fortify",
        name: "장갑 전개",
        intent: "defend",
        description: "방어도 12",
        effects: [{ kind: "block", amount: 12 }],
      },
      smite: {
        id: "smite",
        name: "집행 강타",
        intent: "attack",
        description: "피해 21",
        effects: [{ kind: "damage", amount: 21 }],
      },
    },
  },
  // 2막 보스(Z 울트라리스크 "심연의 돌격수"): 광폭화(힘 누적)로 점증하는 돌진형 위협.
  abyssal_charger: {
    id: "abyssal_charger",
    name: "심연의 돌격수",
    subtitle: "Z 울트라 보스 모티브",
    maxHp: 210,
    tier: "boss",
    texture: "abyssal_charger",
    pattern: ["gore", "enrage", "stomp", "gore"],
    actions: {
      gore: {
        id: "gore",
        name: "심연 돌진",
        intent: "attack",
        description: "피해 21",
        effects: [{ kind: "damage", amount: 21 }],
      },
      enrage: {
        id: "enrage",
        name: "광폭화",
        intent: "buff",
        description: "힘 +2",
        effects: [{ kind: "applyStatus", status: "strength", amount: 2, target: "self" }],
      },
      stomp: {
        id: "stomp",
        name: "대지 강타",
        intent: "attack",
        description: "피해 9 × 2",
        effects: [{ kind: "damage", amount: 9, hits: 2 }],
      },
    },
  },
  // ===== 3막(성간의 종말) 적. 전용 6포즈 시트 + 공용 전투 VFX 사용. =====
  // P: 강한 단일 공격과 견고한 방어 교대(보호·충전 정체성의 최종 형태).
  interceptor: {
    id: "interceptor",
    name: "정밀 요격기",
    subtitle: "P 요격기 모티브",
    maxHp: 81,
    tier: "normal",
    texture: "interceptor",
    pattern: ["pinpoint", "hardened_shield", "pinpoint"],
    actions: {
      pinpoint: {
        id: "pinpoint",
        name: "정밀 타격",
        intent: "attack",
        description: "피해 21",
        effects: [{ kind: "damage", amount: 21 }],
      },
      hardened_shield: {
        id: "hardened_shield",
        name: "경화 보호막",
        intent: "defend",
        description: "방어도 14",
        effects: [{ kind: "block", amount: 14 }],
      },
    },
  },
  // T: 다단 + 자가 강화 + 중포(순환·화력 정체성의 최종 형태).
  fire_support: {
    id: "fire_support",
    name: "화력 지원선",
    subtitle: "T 순양함 모티브",
    maxHp: 78,
    tier: "normal",
    texture: "fire_support",
    pattern: ["bombardment", "weapon_charge", "heavy_salvo", "bombardment"],
    actions: {
      bombardment: {
        id: "bombardment",
        name: "맹렬 포격",
        intent: "attack",
        description: "피해 9 × 2",
        effects: [{ kind: "damage", amount: 9, hits: 2 }],
      },
      weapon_charge: {
        id: "weapon_charge",
        name: "무장 충전",
        intent: "buff",
        description: "힘 +2",
        effects: [{ kind: "applyStatus", status: "strength", amount: 2, target: "self" }],
      },
      heavy_salvo: {
        id: "heavy_salvo",
        name: "중포 일제 사격",
        intent: "attack",
        description: "피해 18",
        effects: [{ kind: "damage", amount: 18 }],
      },
    },
  },
  // Z: 취약 + 대형 다단으로 폭딤(증식·대가 정체성의 최종 형태).
  abyssal_cluster: {
    id: "abyssal_cluster",
    name: "심연 군집체",
    subtitle: "Z 군집 모티브",
    maxHp: 84,
    tier: "normal",
    texture: "abyssal_cluster",
    pattern: ["corrosive_spray", "swarm_assault", "regen_carapace", "swarm_assault"],
    actions: {
      corrosive_spray: {
        id: "corrosive_spray",
        name: "부식 분사",
        intent: "debuff",
        description: "피해 12 + 취약 2",
        effects: [
          { kind: "damage", amount: 12 },
          { kind: "applyStatus", status: "vulnerable", amount: 2, target: "enemy" },
        ],
      },
      swarm_assault: {
        id: "swarm_assault",
        name: "군집 돌격",
        intent: "attack",
        description: "피해 8 × 3",
        effects: [{ kind: "damage", amount: 8, hits: 3 }],
      },
      regen_carapace: {
        id: "regen_carapace",
        name: "재생 갑각",
        intent: "defend",
        description: "방어도 10",
        effects: [{ kind: "block", amount: 10 }],
      },
    },
  },
  // 3막 엘리트(P): 쌍발 포화 + 강타 + 견고 장갑.
  battleship_escort: {
    id: "battleship_escort",
    name: "전함 호위대",
    subtitle: "P 정예 호위 모티브",
    maxHp: 114,
    tier: "normal",
    texture: "battleship_escort",
    pattern: ["twin_cannon", "reinforce", "executioner", "twin_cannon"],
    actions: {
      twin_cannon: {
        id: "twin_cannon",
        name: "쌍관절 포화",
        intent: "attack",
        description: "피해 12 × 2",
        effects: [{ kind: "damage", amount: 12, hits: 2 }],
      },
      reinforce: {
        id: "reinforce",
        name: "중장갑 전개",
        intent: "defend",
        description: "방어도 16",
        effects: [{ kind: "block", amount: 16 }],
      },
      executioner: {
        id: "executioner",
        name: "집행 타격",
        intent: "attack",
        description: "피해 27",
        effects: [{ kind: "damage", amount: 27 }],
      },
    },
  },
  // 3막 최종 보스(T 배틀크루저 "성간 전함"): 목표 고정→고출력 주포 사이클 + 중장갑.
  // 광폭화(힘 누적)가 아닌 "조준 고정"으로 매 주기 화력이 상승하는 돌격형 최종 보스.
  interstellar_battleship: {
    id: "interstellar_battleship",
    name: "성간 전함",
    subtitle: "T 배틀크루저 최종 보스 모티브",
    maxHp: 248,
    tier: "boss",
    texture: "interstellar_battleship",
    pattern: ["target_lock", "main_cannon", "neutronium_plating", "main_cannon"],
    actions: {
      target_lock: {
        id: "target_lock",
        name: "목표 고정",
        intent: "buff",
        description: "힘 +2",
        effects: [{ kind: "applyStatus", status: "strength", amount: 2, target: "self" }],
      },
      main_cannon: {
        id: "main_cannon",
        name: "양자 주포",
        intent: "attack",
        description: "피해 26",
        effects: [{ kind: "damage", amount: 26 }],
      },
      neutronium_plating: {
        id: "neutronium_plating",
        name: "중성자 갑판",
        intent: "defend",
        description: "방어도 15",
        effects: [{ kind: "block", amount: 15 }],
      },
    },
  },
  nexus_core: {
    id: "nexus_core",
    name: "넥서스 코어",
    subtitle: "P 종족 중앙 연산 유닛",
    maxHp: 200,
    tier: "boss",
    texture: "nexus_core",
    pattern: ["calculate", "laser", "shield"],
    phaseTriggerHpRatio: 0.5,
    phase2Pattern: ["overclock", "laser", "laser", "shield"],
    actions: {
      calculate: {
        id: "calculate",
        name: "연산",
        intent: "buff",
        description: "힘 +2",
        effects: [{ kind: "applyStatus", status: "strength", amount: 2, target: "self" }],
      },
      laser: {
        id: "laser",
        name: "플라즈마 레이저",
        intent: "attack",
        description: "피해 15",
        effects: [{ kind: "damage", amount: 15 }],
      },
      shield: {
        id: "shield",
        name: "양자 방패",
        intent: "defend",
        description: "방어도 20",
        effects: [{ kind: "block", amount: 20 }],
      },
      overclock: {
        id: "overclock",
        name: "오버클럭 (2페이즈)",
        intent: "buff",
        description: "재생 10",
        effects: [{ kind: "applyStatus", status: "regen", amount: 10, target: "self" }],
      },
    },
  },
  void_entity: {
    id: "void_entity",
    name: "공허의 정수",
    subtitle: "P 종족 고대 병기",
    maxHp: 280,
    tier: "boss",
    texture: "void_entity",
    pattern: ["void_gaze", "crush", "crush", "absorb"],
    phaseTriggerHpRatio: 0.4,
    phase2Pattern: ["void_collapse", "crush", "absorb", "crush"],
    actions: {
      void_gaze: {
        id: "void_gaze",
        name: "공허의 응시",
        intent: "debuff",
        description: "취약 3",
        effects: [{ kind: "applyStatus", status: "vulnerable", amount: 3, target: "enemy" }],
      },
      crush: {
        id: "crush",
        name: "압살",
        intent: "attack",
        description: "피해 20",
        effects: [{ kind: "damage", amount: 20 }],
      },
      absorb: {
        id: "absorb",
        name: "에너지 흡수",
        intent: "defend",
        description: "방어도 15",
        effects: [{ kind: "block", amount: 15 }],
      },
      void_collapse: {
        id: "void_collapse",
        name: "공허 붕괴 (2페이즈)",
        intent: "attack",
        description: "피해 5 × 6",
        effects: [{ kind: "damage", amount: 5, hits: 6 }],
      },
    },
  },
  dreadnought_mech: {
    id: "dreadnought_mech",
    name: "드레드노트 메크",
    subtitle: "T 종족 파괴병기",
    maxHp: 320,
    tier: "boss",
    texture: "dreadnought_mech",
    pattern: ["missile_swarm", "fortify", "heavy_strike"],
    phaseTriggerHpRatio: 0.3,
    phase2Pattern: ["core_meltdown", "heavy_strike", "missile_swarm"],
    actions: {
      missile_swarm: {
        id: "missile_swarm",
        name: "미사일 포화",
        intent: "attack",
        description: "피해 6 × 3",
        effects: [{ kind: "damage", amount: 6, hits: 3 }],
      },
      fortify: {
        id: "fortify",
        name: "요새화",
        intent: "defend",
        description: "방어도 30",
        effects: [{ kind: "block", amount: 30 }],
      },
      heavy_strike: {
        id: "heavy_strike",
        name: "중갑 타격",
        intent: "attack",
        description: "피해 25, 약화 2",
        effects: [
          { kind: "damage", amount: 25 },
          { kind: "applyStatus", status: "weak", amount: 2, target: "enemy" }
        ],
      },
      core_meltdown: {
        id: "core_meltdown",
        name: "코어 멜트다운 (2페이즈)",
        intent: "attack",
        description: "피해 40",
        effects: [{ kind: "damage", amount: 40 }],
      },
    },
  },
};

// 카드 강화 변형(`id+`) 자동 생성. 휴식 노드에서 강화 시 덱의 기본 카드를 +버전으로 교체한다.
const STATUS_LABEL: Record<string, string> = { vulnerable: "취약", weak: "약화", strength: "힘", poison: "중독", regen: "재생", stun: "기절" };

function upgradeEffect(effect: Effect): Effect {
  if (effect.kind === "damage") return { ...effect, amount: effect.amount + 3 };
  if (effect.kind === "block") return { ...effect, amount: effect.amount + 3 };
  return { ...effect, amount: effect.amount + 1 };
}

function describeEffects(effects: Effect[]): string {
  return effects
    .map((effect) => {
      if (effect.kind === "damage") {
        return `피해 ${effect.amount}${effect.hits && effect.hits > 1 ? ` × ${effect.hits}` : ""}`;
      }
      if (effect.kind === "block") return `방어도 ${effect.amount}`;
      if (effect.kind === "draw") return `카드 ${effect.amount}장 뽑기`;
      if (effect.kind === "energy") return `에너지 +${effect.amount}`;
      const label = STATUS_LABEL[effect.status] ?? effect.status;
      if (effect.status === "strength") return `힘 +${effect.amount}`;
      return `${effect.target === "enemy" ? "적에게 " : ""}${label} ${effect.amount}`;
    })
    .join(" · ");
}

for (const base of Object.values({ ...cards })) {
  const upgradedId = `${base.id}+`;
  const upgradedEffects = base.effects.map(upgradeEffect);
  const description = base.exhaust
    ? `${describeEffects(upgradedEffects)} · 소멸`
    : describeEffects(upgradedEffects);
  cards[upgradedId] = {
    ...base,
    id: upgradedId,
    name: `${base.name}+`,
    description,
    effects: upgradedEffects,
  };
}

export const battleContent: BattleContent = { cards, characters, enemies };
