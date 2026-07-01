// 1막 포션 콘텐츠. 직렬화 가능한 데이터 정의로, 전투 중에만 사용·소모한다.
// 효과(PotionAction)는 BattleEngine.usePotion이 적용한다. 노드 보상으로 획득하고
// RunState.potions(최대 2슬롯)에 보관하며, 사용한 포션은 전투 종료 시 슬롯에서 제거된다.

import type { PotionAction } from "../game/engine/types";

export type PotionType = "attack" | "skill";

export interface PotionDef {
  id: string;
  name: string;
  type: PotionType;
  description: string;
  flavor?: string;
  effect: PotionAction;
}

export const MAX_POTIONS = 2;

export const POTIONS: Record<string, PotionDef> = {
  molotov: {
    id: "molotov",
    name: "화염병",
    type: "attack",
    description: "적에게 피해 12",
    flavor: "급조한 화염병. 던지면 그걸로 끝.",
    effect: { kind: "damage", amount: 12 },
  },
  vigor_shot: {
    id: "vigor_shot",
    name: "활력 주사",
    type: "skill",
    description: "이번 턴 에너지 +2",
    flavor: "전투 자극제 1회분. 심장이 거세게 뛴다.",
    effect: { kind: "energy", amount: 2 },
  },
  blockade_serum: {
    id: "blockade_serum",
    name: "철벽 혈청",
    type: "skill",
    description: "방어도 15",
    flavor: "T 강화 갑각 주사. 피부가 잠깐 강철이 된다.",
    effect: { kind: "block", amount: 15 },
  },
  vitality_draft: {
    id: "vitality_draft",
    name: "생명력 물약",
    type: "skill",
    description: "체력 15 회복",
    flavor: "P 생체 결정 추출물. 상처를 빠르게 봉합한다.",
    effect: { kind: "heal", amount: 15 },
  },
  focus_brew: {
    id: "focus_brew",
    name: "명상의 물약",
    type: "skill",
    description: "카드 3장 뽑기",
    flavor: "Z 신경 전달 물질. 순간적으로 사고가 빨라진다.",
    effect: { kind: "draw", amount: 3 },
  },
};

export const ACT_ONE_POTION_POOL = Object.keys(POTIONS);
