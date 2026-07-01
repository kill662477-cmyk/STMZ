export type RunNodeType =
  | "battle"
  | "elite"
  | "event"
  | "shop"
  | "rest"
  | "treasure"
  | "boss";

export interface RunNode {
  id: string;
  act: number;
  floor: number;
  lane: number;
  type: RunNodeType;
  title: string;
  subtitle: string;
  encounterId?: string;
  // 다중 적 전투. encounterId는 구형 저장·단일 적 코드 호환을 위해 첫 적을 유지한다.
  encounterIds?: string[];
  nextIds: string[];
}

export interface RunReward {
  sourceNodeId: string;
  cardIds: string[];
  gold: number;
  relicId?: string;
  potionId?: string;
}

export type RunPhase =
  | "map"
  | "battle"
  | "reward"
  | "rest"
  | "event"
  | "shop"
  | "treasure"
  | "boss_reward"
  | "won"
  | "lost";

export interface ActiveEvent {
  sourceNodeId: string;
  eventId: string;
}

export interface ActiveTreasure {
  sourceNodeId: string;
  relicIds: string[];
}

export interface ActiveBossReward {
  cardIds: string[];
  relicIds: string[];
}

export interface ShopItem {
  id: string;
  cardId: string;
  price: number;
  sold: boolean;
}

export interface ShopRelicItem {
  id: string;
  relicId: string;
  price: number;
  sold: boolean;
}

export interface ShopPotionItem {
  id: string;
  potionId: string;
  price: number;
  sold: boolean;
}

export interface ActiveShop {
  sourceNodeId: string;
  items: ShopItem[];
  // Optional for backward compatibility with version-1 saves created before mixed shop stock.
  relicItems?: ShopRelicItem[];
  potionItems?: ShopPotionItem[];
  removalPrice: number;
  removalUsed: boolean;
}

// 현재 제작된 막. 1막 = 황혼의 폐허, 2막 = 공명하는 심연, 3막 = 성간의 종말.
export type ActNumber = 1 | 2 | 3;
export const FINAL_ACT: ActNumber = 3;

export interface RunState {
  version: 2;
  ascension: number;
  seed: number;
  act: ActNumber;
  phase: RunPhase;
  characterId: string;
  hp: number;
  maxHp: number;
  gold: number;
  deck: string[];
  relics: string[];
  potions: string[];
  currentNodeId: string | null;
  completedNodeIds: string[];
  availableNodeIds: string[];
  reward: RunReward | null;
  event: ActiveEvent | null;
  shop: ActiveShop | null;
  treasure: ActiveTreasure | null;
  bossReward: ActiveBossReward | null;
}
