import type { BattleContent, CardRarity } from "../engine/types";
import { Rng } from "../engine/rng";
import { getAllEvents, getEventsForAct, type EventChoice, type EventDef } from "../../content/events";
import {
  ACT_ONE_RELIC_POOL,
  RELICS,
  battleModifiersFor,
  type RelicRarity,
} from "../../content/relics";
import { ACT_ONE_POTION_POOL, MAX_POTIONS, POTIONS } from "../../content/potions";
import { createActOneMap } from "./actOne";
import { raceCardPool } from "../../content/cardPools";
import { createActTwoMap } from "./actTwo";
import { createActThreeMap } from "./actThree";
import { FINAL_ACT, type ActNumber, type ActiveBossReward, type ActiveShop, type ActiveTreasure, type RunNode, type RunState } from "./types";

// 막별 지도 생성 디스패치. 1막 생성 로직은 건드리지 않고 막 번호로 분기한다.
function createActMap(act: ActNumber, seed: number, ascension: number = 1): RunNode[] {
  if (act === 3) return createActThreeMap(seed, ascension);
  return act === 2 ? createActTwoMap(seed, ascension) : createActOneMap(seed, ascension);
}

// 막 간 콘텐츠 시드 분리용. 1막은 (act-1)=0이라 기존 시드/결정성이 그대로 보존된다.
function actSalt(act: ActNumber): number {
  return (act - 1) * 7919;
}

export interface RunOptions {
  seed: number;
  characterId: string;
  ascension?: number;
}

type PriceRange = readonly [min: number, max: number];

const CARD_SHOP_PRICES: Record<CardRarity, PriceRange> = {
  common: [40, 60],
  uncommon: [70, 95],
  rare: [110, 145],
};

const RELIC_SHOP_PRICES: Record<RelicRarity, PriceRange> = {
  starter: [120, 160],
  common: [120, 160],
  uncommon: [170, 220],
  rare: [230, 280],
};

const POTION_SHOP_PRICE: PriceRange = [45, 80];

function rollPrice(rng: Rng, [min, max]: PriceRange): number {
  return min + rng.int(max - min + 1);
}

export class RunEngine {
  readonly state: RunState;
  nodes: RunNode[];
  private readonly content: BattleContent;

  constructor(content: BattleContent, options: RunOptions) {
    const character = content.characters[options.characterId];
    if (!character) throw new Error(`Unknown character: ${options.characterId}`);

    this.content = content;
    this.nodes = createActOneMap(options.seed, options.ascension ?? 1);
    this.state = {
      version: 2,
      ascension: options.ascension ?? 1,
      seed: options.seed,
      act: 1,
      phase: "map",
      characterId: character.id,
      hp: character.maxHp,
      maxHp: character.maxHp,
      gold: 75,
      deck: [...character.deck],
      relics: character.startingRelic ? [character.startingRelic] : [],
      potions: [],
      currentNodeId: null,
      completedNodeIds: [],
      availableNodeIds: this.nodes.filter((node) => node.floor === 1).map((node) => node.id),
      reward: null,
      event: null,
      shop: null,
      treasure: null,
      bossReward: null,
    };
  }

  /** Rebuilds a run from a validated, versioned JSON snapshot. */
  static restore(content: BattleContent, snapshot: RunState): RunEngine {
    if (snapshot.version !== 2 || (snapshot.act !== 1 && snapshot.act !== 2 && snapshot.act !== 3)) {
      throw new Error("Unsupported run save version.");
    }
    if (!content.characters[snapshot.characterId]) {
      throw new Error(`Unknown character: ${snapshot.characterId}`);
    }

    const run = new RunEngine(content, {
      characterId: snapshot.characterId,
      seed: snapshot.seed,
      ascension: snapshot.ascension,
    });
    // 저장된 막의 지도로 재구성한다(생성자는 1막 지도를 만든다).
    if (snapshot.act !== run.state.act) {
      run.nodes = createActMap(snapshot.act, snapshot.seed, snapshot.ascension);
    }
    const nodeIds = new Set(run.nodes.map((node) => node.id));
    const assertNodeIds = (ids: string[]) => {
      if (ids.some((id) => !nodeIds.has(id))) throw new Error("Run save contains an unknown node.");
    };

    assertNodeIds(snapshot.completedNodeIds);
    assertNodeIds(snapshot.availableNodeIds);
    if (snapshot.currentNodeId && !nodeIds.has(snapshot.currentNodeId)) {
      throw new Error("Run save contains an unknown active node.");
    }
    for (const sourceNodeId of [
      snapshot.reward?.sourceNodeId,
      snapshot.event?.sourceNodeId,
      snapshot.shop?.sourceNodeId,
      snapshot.treasure?.sourceNodeId,
    ]) {
      if (sourceNodeId && !nodeIds.has(sourceNodeId)) {
        throw new Error("Run save contains an unknown source node.");
      }
    }
    if (snapshot.deck.some((cardId) => !content.cards[cardId])) {
      throw new Error("Run save contains an unknown card.");
    }
    if (snapshot.relics.some((relicId) => !RELICS[relicId])) {
      throw new Error("Run save contains an unknown relic.");
    }
    if (snapshot.potions.some((potionId) => !POTIONS[potionId])) {
      throw new Error("Run save contains an unknown potion.");
    }
    if (snapshot.potions.length > MAX_POTIONS) {
      throw new Error("Run save exceeds the potion slot limit.");
    }
    if (snapshot.reward?.cardIds.some((cardId) => !content.cards[cardId])) {
      throw new Error("Run save contains an unknown reward card.");
    }
    if (snapshot.reward?.relicId && !RELICS[snapshot.reward.relicId]) {
      throw new Error("Run save contains an unknown reward relic.");
    }
    if (snapshot.reward?.potionId && !POTIONS[snapshot.reward.potionId]) {
      throw new Error("Run save contains an unknown reward potion.");
    }
    if (snapshot.shop?.items.some((item) => !content.cards[item.cardId])) {
      throw new Error("Run save contains an unknown shop card.");
    }
    if (snapshot.shop?.relicItems?.some((item) => !RELICS[item.relicId])) {
      throw new Error("Run save contains an unknown shop relic.");
    }
    if (snapshot.shop?.potionItems?.some((item) => !POTIONS[item.potionId])) {
      throw new Error("Run save contains an unknown shop potion.");
    }
    if (snapshot.treasure?.relicIds.some((relicId) => !RELICS[relicId])) {
      throw new Error("Run save contains an unknown treasure relic.");
    }
    if (snapshot.bossReward?.cardIds.some((cardId) => !content.cards[cardId])) {
      throw new Error("Run save contains an unknown boss reward card.");
    }
    if (snapshot.bossReward?.relicIds.some((relicId) => !RELICS[relicId])) {
      throw new Error("Run save contains an unknown boss reward relic.");
    }

    const currentNode = snapshot.currentNodeId
      ? run.getNode(snapshot.currentNodeId)
      : null;
    if (snapshot.phase === "map" && currentNode) {
      throw new Error("Map save cannot have an active node.");
    }
    if (snapshot.phase === "battle" && !currentNode?.encounterId) {
      throw new Error("Battle save is missing its encounter.");
    }
    if (snapshot.phase === "reward" && (!snapshot.reward || !currentNode)) {
      throw new Error("Reward save is incomplete.");
    }
    if (snapshot.reward && snapshot.reward.sourceNodeId !== snapshot.currentNodeId) {
      throw new Error("Reward save does not match its active node.");
    }
    if (snapshot.phase === "rest" && currentNode?.type !== "rest") {
      throw new Error("Rest save is missing its rest node.");
    }
    if (snapshot.phase === "event" && (!snapshot.event || currentNode?.type !== "event")) {
      throw new Error("Event save is incomplete.");
    }
    if (
      snapshot.event &&
      (snapshot.event.sourceNodeId !== snapshot.currentNodeId ||
        !getAllEvents().some((event) => event.id === snapshot.event!.eventId))
    ) {
      throw new Error("Event save does not match its active node.");
    }
    if (snapshot.phase === "shop" && (!snapshot.shop || currentNode?.type !== "shop")) {
      throw new Error("Shop save is incomplete.");
    }
    if (snapshot.shop && snapshot.shop.sourceNodeId !== snapshot.currentNodeId) {
      throw new Error("Shop save does not match its active node.");
    }
    if (
      snapshot.phase === "treasure" &&
      (!snapshot.treasure || currentNode?.type !== "treasure")
    ) {
      throw new Error("Treasure save is incomplete.");
    }
    if (snapshot.treasure && snapshot.treasure.sourceNodeId !== snapshot.currentNodeId) {
      throw new Error("Treasure save does not match its active node.");
    }
    if (snapshot.phase === "boss_reward" && !snapshot.bossReward) {
      throw new Error("Boss reward save is incomplete.");
    }

    Object.assign(run.state, {
      ...snapshot,
      deck: [...snapshot.deck],
      relics: [...snapshot.relics],
      potions: [...snapshot.potions],
      completedNodeIds: [...snapshot.completedNodeIds],
      availableNodeIds: [...snapshot.availableNodeIds],
      reward: snapshot.reward
        ? { ...snapshot.reward, cardIds: [...snapshot.reward.cardIds] }
        : null,
      event: snapshot.event ? { ...snapshot.event } : null,
      shop: snapshot.shop
        ? {
            ...snapshot.shop,
            items: snapshot.shop.items.map((item) => ({ ...item })),
            relicItems: snapshot.shop.relicItems?.map((item) => ({ ...item })),
            potionItems: snapshot.shop.potionItems?.map((item) => ({ ...item })),
          }
        : null,
      treasure: snapshot.treasure
        ? { ...snapshot.treasure, relicIds: [...snapshot.treasure.relicIds] }
        : null,
      bossReward: snapshot.bossReward
        ? { ...snapshot.bossReward, cardIds: [...snapshot.bossReward.cardIds], relicIds: [...snapshot.bossReward.relicIds] }
        : null,
    });
    return run;
  }

  get currentNode(): RunNode | null {
    return this.state.currentNodeId ? this.getNode(this.state.currentNodeId) : null;
  }

  getNode(id: string): RunNode {
    const node = this.nodes.find((candidate) => candidate.id === id);
    if (!node) throw new Error(`Unknown run node: ${id}`);
    return node;
  }

  // 유물을 획득한다. maxHp 효과는 획득 즉시 런 상태에 반영하고(최대·현재 체력 증가),
  // 전투 관련 효과는 이후 전투 시작 시 battleModifiers()로 집계된다.
  gainRelic(id: string): void {
    const relic = RELICS[id];
    if (!relic) throw new Error(`Unknown relic: ${id}`);
    if (this.state.relics.includes(id)) throw new Error("Relic is already owned.");
    this.state.relics.push(id);
    for (const effect of relic.effects) {
      if (effect.kind === "maxHp") {
        this.state.maxHp += effect.amount;
        this.state.hp = Math.min(this.state.maxHp, this.state.hp + effect.amount);
      }
    }
  }

  hasRelic(id: string): boolean {
    return this.state.relics.includes(id);
  }

  battleModifiers() {
    return battleModifiersFor(this.state.relics);
  }

  // 캐릭터 종족에 따른 드래프트 카드 풀(보상·상점 공유).
  private cardPool(): string[] {
    const character = this.content.characters[this.state.characterId];
    return raceCardPool(character?.race ?? "T");
  }

  startNode(id: string): void {
    if (this.state.phase !== "map") throw new Error("Run is not on the map.");
    if (!this.state.availableNodeIds.includes(id)) throw new Error("Node is not reachable.");
    const node = this.getNode(id);
    this.state.currentNodeId = id;
    if (node.type === "rest") {
      this.state.phase = "rest";
      return;
    }
    if (node.type === "event") {
      this.state.event = { sourceNodeId: node.id, eventId: this.pickEvent(node).id };
      this.state.phase = "event";
      return;
    }
    if (node.type === "shop") {
      this.state.shop = this.buildShop(node);
      this.state.phase = "shop";
      return;
    }
    if (node.type === "treasure") {
      this.state.treasure = this.buildTreasure(node);
      this.state.phase = "treasure";
      return;
    }
    if (!node.encounterId) throw new Error("Node has no encounter.");
    this.state.phase = "battle";
  }

  private pickEvent(node: RunNode): EventDef {
    const rng = new Rng(this.state.seed + node.floor * 733 + node.lane * 29 + actSalt(this.state.act));
    const actEvents = getEventsForAct(this.state.act);
    return rng.shuffle(actEvents)[0];
  }

  currentEvent(): EventDef | null {
    if (this.state.phase !== "event" || !this.state.event) return null;
    const event = getAllEvents().find((candidate) => candidate.id === this.state.event!.eventId);
    return event ?? null;
  }

  resolveEvent(choiceId: string): void {
    if (this.state.phase !== "event" || !this.state.event) throw new Error("No event is active.");
    const event = this.currentEvent();
    if (!event) throw new Error("Active event is missing.");
    const choice = event.choices.find((candidate) => candidate.id === choiceId);
    if (!choice) throw new Error("Choice is not in this event.");

    this.applyEventChoice(choice);
    const node = this.getNode(this.state.event.sourceNodeId);
    this.state.event = null;
    if (this.state.hp <= 0) {
      this.state.phase = "lost";
      this.state.currentNodeId = null;
      return;
    }
    this.finishNode(node);
    this.state.currentNodeId = null;
    this.state.phase = "map";
  }

  private applyEventChoice(choice: EventChoice): void {
    for (const effect of choice.effects) {
      switch (effect.kind) {
        case "heal":
          this.state.hp = Math.min(this.state.maxHp, this.state.hp + effect.amount);
          break;
        case "loseHp":
          this.state.hp = Math.max(0, this.state.hp - effect.amount);
          break;
        case "loseMaxHp":
          this.state.maxHp = Math.max(1, this.state.maxHp - effect.amount);
          if (this.state.hp > this.state.maxHp) this.state.hp = this.state.maxHp;
          break;
        case "gainGold":
          this.state.gold += effect.amount;
          break;
        case "loseGold":
          this.state.gold = Math.max(0, this.state.gold - effect.amount);
          break;
        case "addCard":
          if (this.content.cards[effect.cardId]) this.state.deck.push(effect.cardId);
          break;
      }
    }
  }

  private buildShop(node: RunNode): ActiveShop {
    const rng = new Rng(this.state.seed + node.floor * 613 + node.lane * 37 + actSalt(this.state.act));
    const cardIds = rng
      .shuffle(this.cardPool())
      .filter((cardId) => Boolean(this.content.cards[cardId]))
      .slice(0, 4);
    const relicIds = rng
      .shuffle(ACT_ONE_RELIC_POOL)
      .filter(
        (relicId) =>
          Boolean(RELICS[relicId]) &&
          RELICS[relicId].rarity !== "starter" &&
          !this.state.relics.includes(relicId),
      )
      .slice(0, 2);
    const potionIds = rng
      .shuffle(ACT_ONE_POTION_POOL)
      .filter((potionId) => Boolean(POTIONS[potionId]))
      .slice(0, 2);

    const items = cardIds.map((cardId, index) => {
      const card = this.content.cards[cardId];
      return {
        id: `${node.id}-item${index}`,
        cardId,
        price: rollPrice(rng, CARD_SHOP_PRICES[card.rarity]),
        sold: false,
      };
    });
    const relicItems = relicIds.map((relicId, index) => ({
      id: `${node.id}-relic${index}`,
      relicId,
      price: rollPrice(rng, RELIC_SHOP_PRICES[RELICS[relicId].rarity]),
      sold: false,
    }));
    const potionItems = potionIds.map((potionId, index) => ({
      id: `${node.id}-potion${index}`,
      potionId,
      price: rollPrice(rng, POTION_SHOP_PRICE),
      sold: false,
    }));
    return {
      sourceNodeId: node.id,
      items,
      relicItems,
      potionItems,
      removalPrice: 75,
      removalUsed: false,
    };
  }

  currentShop(): ActiveShop | null {
    return this.state.phase === "shop" ? this.state.shop : null;
  }

  buyShopItem(itemId: string): void {
    const shop = this.requireShop();
    const item = shop.items.find((candidate) => candidate.id === itemId);
    if (!item) throw new Error("Item is not in this shop.");
    if (item.sold) throw new Error("Item is already sold.");
    if (this.state.gold < item.price) throw new Error("Not enough gold.");
    this.state.gold -= item.price;
    this.state.deck.push(item.cardId);
    item.sold = true;
  }

  buyShopRelic(itemId: string): void {
    const shop = this.requireShop();
    const item = shop.relicItems?.find((candidate) => candidate.id === itemId);
    if (!item) throw new Error("Relic is not in this shop.");
    if (item.sold) throw new Error("Relic is already sold.");
    if (this.hasRelic(item.relicId)) throw new Error("Relic is already owned.");
    if (this.state.gold < item.price) throw new Error("Not enough gold.");
    this.gainRelic(item.relicId);
    this.state.gold -= item.price;
    item.sold = true;
  }

  buyShopPotion(itemId: string): void {
    const shop = this.requireShop();
    const item = shop.potionItems?.find((candidate) => candidate.id === itemId);
    if (!item) throw new Error("Potion is not in this shop.");
    if (item.sold) throw new Error("Potion is already sold.");
    if (this.state.potions.length >= MAX_POTIONS) throw new Error("Potion slots are full.");
    if (this.state.gold < item.price) throw new Error("Not enough gold.");
    this.state.gold -= item.price;
    this.state.potions.push(item.potionId);
    item.sold = true;
  }

  removeCard(cardId: string): void {
    const shop = this.requireShop();
    if (shop.removalUsed) throw new Error("Card removal already used.");
    if (this.state.gold < shop.removalPrice) throw new Error("Not enough gold.");
    const index = this.state.deck.indexOf(cardId);
    if (index === -1) throw new Error("Card is not in the deck.");
    this.state.gold -= shop.removalPrice;
    this.state.deck.splice(index, 1);
    shop.removalUsed = true;
  }

  leaveShop(): void {
    const shop = this.requireShop();
    const node = this.getNode(shop.sourceNodeId);
    this.state.shop = null;
    this.finishNode(node);
    this.state.currentNodeId = null;
    this.state.phase = "map";
  }

  private requireShop(): ActiveShop {
    if (this.state.phase !== "shop" || !this.state.shop) throw new Error("No shop is active.");
    return this.state.shop;
  }

  private buildTreasure(node: RunNode): ActiveTreasure {
    const rng = new Rng(this.state.seed + node.floor * 839 + node.lane * 53 + actSalt(this.state.act));
    const relicIds = rng
      .shuffle(ACT_ONE_RELIC_POOL)
      .filter((id) => RELICS[id] && !this.state.relics.includes(id))
      .slice(0, 3);
    return { sourceNodeId: node.id, relicIds };
  }

  currentTreasure(): ActiveTreasure | null {
    return this.state.phase === "treasure" ? this.state.treasure : null;
  }

  chooseTreasure(relicId: string | null): void {
    if (this.state.phase !== "treasure" || !this.state.treasure) {
      throw new Error("No treasure is active.");
    }
    if (relicId !== null) {
      if (!this.state.treasure.relicIds.includes(relicId)) {
        throw new Error("Relic is not in this treasure.");
      }
      this.gainRelic(relicId);
    }
    const node = this.getNode(this.state.treasure.sourceNodeId);
    this.state.treasure = null;
    this.finishNode(node);
    this.state.currentNodeId = null;
    this.state.phase = "map";
  }

  restHealAmount(): number {
    return Math.floor(this.state.maxHp * 0.25);
  }

  upgradeableCards(): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const cardId of this.state.deck) {
      if (cardId.endsWith("+")) continue;
      if (!this.content.cards[`${cardId}+`]) continue;
      if (seen.has(cardId)) continue;
      seen.add(cardId);
      result.push(cardId);
    }
    return result;
  }

  restHeal(): void {
    const node = this.requireRestNode();
    this.state.hp = Math.min(this.state.maxHp, this.state.hp + this.restHealAmount());
    this.finishRestNode(node);
  }

  restUpgrade(cardId: string): void {
    const node = this.requireRestNode();
    const index = this.state.deck.indexOf(cardId);
    if (index === -1) throw new Error("Card is not in the deck.");
    const upgradedId = `${cardId}+`;
    if (!this.content.cards[upgradedId]) throw new Error("Card cannot be upgraded.");
    this.state.deck[index] = upgradedId;
    this.finishRestNode(node);
  }

  private requireRestNode(): RunNode {
    if (this.state.phase !== "rest") throw new Error("No rest is active.");
    const node = this.currentNode;
    if (!node || node.type !== "rest") throw new Error("Active node is not a rest.");
    return node;
  }

  private finishRestNode(node: RunNode): void {
    this.finishNode(node);
    this.state.currentNodeId = null;
    this.state.phase = "map";
  }

  battleSeed(): number {
    const node = this.currentNode;
    if (!node) return this.state.seed;
    return this.state.seed + node.floor * 101 + node.lane * 17 + actSalt(this.state.act);
  }

  // 막 보스 처치 후 다음 막으로 전환한다. HP·골드·덱·유물·포션은 유지하고
  // 지도·진행·임시 상태만 새 막으로 초기화한다.
  // 막 전환 시 최소 체력 보장: 현재 HP가 최대의 30% 미만이면 30%까지 회복한다.
  // 1막에서 큰 피해를 입은 런도 2막 이후를 플레이할 수 있게 하되, 무료 회복으로
  // 난이도가 무너지지 않도록 보장선은 낮게 설정한다(GAME_DESIGN §11).
  private advanceAct(): void {
    const nextAct = (this.state.act + 1) as ActNumber;
    this.state.act = nextAct;
    this.nodes = createActMap(nextAct, this.state.seed, this.state.ascension);
    const healFloor = Math.floor(this.state.maxHp * 0.35);
    if (this.state.hp < healFloor) this.state.hp = healFloor;
    this.state.completedNodeIds = [];
    this.state.availableNodeIds = this.nodes
      .filter((node) => node.floor === 1)
      .map((node) => node.id);
    this.state.currentNodeId = null;
    this.state.reward = null;
    this.state.event = null;
    this.state.shop = null;
    this.state.treasure = null;
    this.state.bossReward = null;
    this.state.phase = "map";
  }

  // 1·2막 보스 처치 후 보스 보상(희귀카드 3중1 + 유물 3중1)을 구성한다.
  private buildBossReward(): void {
    const rng = new Rng(this.state.seed + 99913 + actSalt(this.state.act));
    const pool = this.cardPool();
    const rareCards = pool.filter((id) => this.content.cards[id]?.rarity === "rare");
    const cardIds = rng
      .shuffle(rareCards.length >= 3 ? rareCards : pool)
      .filter((id) => Boolean(this.content.cards[id]))
      .slice(0, 3);
    const relicIds = rng
      .shuffle(ACT_ONE_RELIC_POOL)
      .filter((id) => RELICS[id] && !this.state.relics.includes(id))
      .slice(0, 3);
    this.state.bossReward = { cardIds, relicIds };
    this.state.phase = "boss_reward";
  }

  currentBossReward(): ActiveBossReward | null {
    return this.state.phase === "boss_reward" ? this.state.bossReward : null;
  }

  // 보스 보상 선택: 카드(또는 스킵) + 유물(또는 스킵)을 동시에 처리하고 다음 막으로 전환.
  chooseBossReward(cardId: string | null, relicId: string | null): void {
    if (this.state.phase !== "boss_reward" || !this.state.bossReward) {
      throw new Error("No boss reward is active.");
    }
    const br = this.state.bossReward;
    if (cardId !== null) {
      if (!br.cardIds.includes(cardId)) throw new Error("Card is not in this boss reward.");
      this.state.deck.push(cardId);
    }
    if (relicId !== null) {
      if (!br.relicIds.includes(relicId)) throw new Error("Relic is not in this boss reward.");
      this.gainRelic(relicId);
    }
    this.state.bossReward = null;
    this.advanceAct();
  }

  completeBattle(playerHp: number): void {
    if (this.state.phase !== "battle") throw new Error("No battle is active.");
    const node = this.currentNode;
    if (!node) throw new Error("Active node is missing.");

    this.state.hp = Math.max(0, Math.min(this.state.maxHp, playerHp));
    if (this.state.hp <= 0) {
      this.state.phase = "lost";
      return;
    }

    if (node.type === "boss") {
      this.finishNode(node);
      if (this.state.act < FINAL_ACT) {
        this.buildBossReward();
      } else {
        this.state.phase = "won";
        this.state.currentNodeId = null;
        this.state.availableNodeIds = [];
      }
      return;
    }

    const rewardRng = new Rng(
      this.state.seed + node.floor * 997 + node.lane * 43 + actSalt(this.state.act),
    );
    const cardIds = rewardRng
      .shuffle(this.cardPool())
      .filter((cardId) => Boolean(this.content.cards[cardId]))
      .slice(0, 3);
    const isElite = node.type === "elite";
    // GAME_DESIGN §10: 일반전 골드 18~28, 엘리트 35~45(+보장 유물 §5).
    const gold = isElite ? 35 + rewardRng.int(11) : 18 + rewardRng.int(11);
    let relicId: string | undefined;
    if (isElite) {
      relicId = rewardRng
        .shuffle(ACT_ONE_RELIC_POOL)
        .find((id) => Boolean(RELICS[id]) && !this.state.relics.includes(id));
    }
    // 포션 드롭(엘리트 50%, 일반 40%). 슬롯이 가득 차면 보상 화면에서 받지 못한다.
    let potionId: string | undefined;
    if (rewardRng.next() < (isElite ? 0.5 : 0.4)) {
      potionId = rewardRng.shuffle(ACT_ONE_POTION_POOL)[0];
    }
    this.state.gold += gold;
    this.state.reward = { sourceNodeId: node.id, cardIds, gold, relicId, potionId };
    this.state.phase = "reward";
  }

  // 보상 포션을 빈 슬롯으로 받는다(전투 보상 화면 전용).
  takeRewardPotion(): void {
    if (this.state.phase !== "reward" || !this.state.reward) throw new Error("No reward is active.");
    const potionId = this.state.reward.potionId;
    if (!potionId) throw new Error("No potion to take.");
    if (this.state.potions.length >= MAX_POTIONS) throw new Error("Potion slots are full.");
    this.state.potions.push(potionId);
    this.state.reward = { ...this.state.reward, potionId: undefined };
  }

  // 전투 중 사용한 포션 슬롯을 제거한다(전투 종료 후 런 계층이 호출).
  removePotions(slots: number[]): void {
    const unique = [...new Set(slots)].sort((a, b) => b - a);
    for (const slot of unique) {
      if (slot >= 0 && slot < this.state.potions.length) this.state.potions.splice(slot, 1);
    }
  }

  failBattle(): void {
    if (this.state.phase !== "battle") throw new Error("No battle is active.");
    this.state.hp = 0;
    this.state.phase = "lost";
  }

  chooseReward(cardId: string | null): void {
    if (this.state.phase !== "reward" || !this.state.reward) {
      throw new Error("No card reward is active.");
    }
    if (cardId !== null) {
      if (!this.state.reward.cardIds.includes(cardId)) throw new Error("Card is not in this reward.");
      this.state.deck.push(cardId);
    }
    // 엘리트 보장 유물: 카드 선택/스킵과 무관하게 지급(completeBattle가 미보유 유물을 골랐다).
    if (this.state.reward.relicId) {
      this.gainRelic(this.state.reward.relicId);
    }
    const node = this.getNode(this.state.reward.sourceNodeId);
    this.finishNode(node);
    this.state.reward = null;
    this.state.currentNodeId = null;
    this.state.phase = "map";
  }

  private finishNode(node: RunNode): void {
    if (!this.state.completedNodeIds.includes(node.id)) {
      this.state.completedNodeIds.push(node.id);
    }
    this.state.availableNodeIds = [...node.nextIds];
  }
}
