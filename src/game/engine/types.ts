// Renderer-agnostic combat data contracts.
export type Race = "P" | "T" | "Z";
export type CardType = "attack" | "skill" | "power" | "curse" | "status" | "item" | "potion";
export type CardRarity = "common" | "uncommon" | "rare";
// vulnerable·weak = 매 턴 1 감소하는 디버프. strength = 감소하지 않는 지속 파워(피해 가산).
export type StatusKind = "vulnerable" | "weak" | "strength" | "dexterity" | "frail" | "poison" | "regen" | "stun";
export type Intent = "attack" | "defend" | "buff" | "debuff" | "special";

export type Effect =
  | { kind: "damage"; amount: number; hits?: number }
  | { kind: "block"; amount: number }
  | { kind: "applyStatus"; status: StatusKind; amount: number; target: "self" | "enemy" }
  | { kind: "draw"; amount: number }
  | { kind: "energy"; amount: number };

export interface CardDef {
  id: string;
  name: string;
  type: CardType;
  rarity: CardRarity;
  cost: number;
  description: string;
  effects: Effect[];
  // 캐릭터 시작 덱에만 들어가는 고유 카드. 공용 드래프트 풀에는 포함하지 않는다.
  signatureFor?: string;
  // true면 사용 시 버린 더미가 아니라 소멸 더미로 가서 이번 전투에 다시 나오지 않는다.
  exhaust?: boolean;
}

export interface EnemyActionDef {
  id: string;
  name: string;
  intent: Intent;
  description: string;
  effects: Effect[];
}

export interface EnemyDef {
  id: string;
  name: string;
  subtitle: string;
  maxHp: number;
  tier: "normal" | "boss";
  texture: string;
  pattern: string[];
  phaseTriggerHpRatio?: number;
  phase2Pattern?: string[];
  actions: Record<string, EnemyActionDef>;
}

export interface CharacterDef {
  id: string;
  name: string;
  race: Race;
  maxHp: number;
  baseEnergy: number;
  texture: string;
  deck: string[];
  signatureCard: string;
  startingRelic?: string;
}

export interface BattleContent {
  cards: Record<string, CardDef>;
  enemies: Record<string, EnemyDef>;
  characters: Record<string, CharacterDef>;
}

export type StatusMap = Partial<Record<StatusKind, number>>;

export interface CardInstance {
  instanceId: string;
  cardId: string;
}

export interface PlayerState {
  id: string;
  name: string;
  race: Race;
  hp: number;
  maxHp: number;
  block: number;
  energy: number;
  baseEnergy: number;
  statuses: StatusMap;
  hand: CardInstance[];
  drawPile: CardInstance[];
  discardPile: CardInstance[];
  exhaustPile: CardInstance[];
}

export interface EnemyState {
  definitionId: string;
  hp: number;
  maxHp: number;
  block: number;
  statuses: StatusMap;
  actionIndex: number;
}

export type Phase = "player" | "enemy" | "won" | "lost";

export interface BattleState {
  turn: number;
  phase: Phase;
  player: PlayerState;
  // enemy는 기존 단일 적 호출부를 위한 현재 집중 대상 별칭이다.
  enemy: EnemyState;
  enemies: EnemyState[];
  activeEnemyIndex: number;
  log: string[];
}

export interface IntentView {
  intent: Intent;
  name: string;
  damage?: number;
  hits?: number;
  block?: number;
}

// 유물 등 외부 요인이 전투 시작·매 턴에 주는 수치 보정. 렌더러 독립 순수 데이터.
// combatEnergy: baseEnergy에 더해 매 턴 에너지 증가.
// combatBlock: 첫 턴 시작 시에만 부여되는 방어도.
// combatDraw: 매 턴 추가 드로우 장 수.
export interface BattleModifiers {
  combatEnergy: number;
  combatBlock: number;
  combatDraw: number;
  combatStrength: number;
}

// 포션이 전투 중 즉시 일으키는 1회성 효과. 렌더러 독립 순수 데이터.
// 콘텐츠(content/potions.ts)가 이 형태로 효과를 정의하고 BattleEngine.usePotion이 적용한다.
export type PotionAction =
  | { kind: "damage"; amount: number }
  | { kind: "block"; amount: number }
  | { kind: "energy"; amount: number }
  | { kind: "draw"; amount: number }
  | { kind: "heal"; amount: number };
