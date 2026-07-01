import type { Race } from "../game/engine/types";

// 종족별 드래프트 가능한 카드 풀(보상·상점 공유). 기본 strike/guard는 제외.
// §8 종족 정체성에 맞춰 각 종족이 다른 플레이 감각을 제공한다.
// T=공격·중화기 / P=보호막·에너지·정밀 / Z=다단·산성·증식.

export const T_CARD_POOL = [
  "quickshot", "doubleshot", "heavyshot", "expose", "suppress",
  "bulwark", "volley", "bash", "flurry", "aimedshot",
  "shieldwall", "pin", "adrenaline", "empower", "flash_bang",
];

export const P_CARD_POOL = [
  "psiblade", "warp_strike", "shield_charge", "focus", "phase_cannon",
  "refraction", "overcharge", "aegis", "mind_spike", "resonance_field",
  "shield_regen", "flash_bang",
];

export const Z_CARD_POOL = [
  "spike_burst", "acid_spray", "carapace", "feral_claw", "metabolism",
  "parasite", "spawn_brood", "impale", "swarm", "adaptive_regrowth",
  "venom_gland", "toxic_spores", "flash_bang",
];

const POOLS: Record<Race, string[]> = {
  T: T_CARD_POOL,
  P: P_CARD_POOL,
  Z: Z_CARD_POOL,
};

export function raceCardPool(race: Race): string[] {
  return POOLS[race] ?? T_CARD_POOL;
}
