import { describe, expect, it } from "vitest";
import { battleContent } from "../../content/battleContent";
import { ACT_ONE_RELIC_POOL, RELICS, battleModifiersFor } from "../../content/relics";
import { ACT_ONE_POTION_POOL, MAX_POTIONS, POTIONS } from "../../content/potions";
import { ACT_ONE_NORMAL_ENCOUNTERS, createActOneMap } from "./actOne";
import { RunEngine } from "./RunEngine";
import { createRunBattle } from "./runBattle";

// Advance one floor regardless of node type, keeping HP at 40 on battle floors.
// 혼합 층에서는 엘리트를 피해 테스트 상태를 단순하게 유지한다.
function pickNonElite(run: RunEngine): string {
  return (
    run.state.availableNodeIds.find((id) => run.getNode(id).type !== "elite") ??
    run.state.availableNodeIds[0]
  );
}

function advanceFloor(run: RunEngine): void {
  run.startNode(pickNonElite(run));
  if (run.state.phase === "event") {
    run.resolveEvent(run.currentEvent()!.choices[0].id);
    return;
  }
  if (run.state.phase === "shop") {
    run.leaveShop();
    return;
  }
  if (run.state.phase === "treasure") {
    run.chooseTreasure(null);
    return;
  }
  run.completeBattle(40);
  run.chooseReward(null);
}

// Walk floors 1-8 so the next available nodes are floor 9 rest nodes.
function reachRest(seed: number): RunEngine {
  const run = new RunEngine(battleContent, { characterId: "jdd", seed });
  for (let floor = 1; floor <= 8; floor++) advanceFloor(run);
  return run;
}

// Walk floors 1-2 (battles) so the next available nodes are floor 3 event nodes.
function reachEvent(seed: number): RunEngine {
  const run = new RunEngine(battleContent, { characterId: "jdd", seed });
  for (let floor = 1; floor <= 2; floor++) advanceFloor(run);
  return run;
}

// Walk floors 1-4 so the next available nodes are floor 5 shop nodes.
function reachShop(seed: number): RunEngine {
  const run = new RunEngine(battleContent, { characterId: "jdd", seed });
  for (let floor = 1; floor <= 4; floor++) advanceFloor(run);
  return run;
}

// 5층은 상점+엘리트 혼합이므로 테스트는 명시적으로 상점 노드를 골라 진입한다.
function startShopNode(run: RunEngine): string {
  const shopId = run.state.availableNodeIds.find((id) => run.getNode(id).type === "shop");
  if (!shopId) throw new Error("test setup: no shop node available");
  run.startNode(shopId);
  return shopId;
}

// 엘리트 보상 로직을 경로 무관하게 검증하기 위해 엘리트 노드를 강제 도달 가능하게 하고 전투를 시작한다.
function startEliteBattle(): RunEngine {
  const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
  const eliteNode = run.nodes.find((n) => n.type === "elite");
  if (!eliteNode) throw new Error("test setup: no elite node");
  run.state.availableNodeIds = [eliteNode.id];
  run.startNode(eliteNode.id);
  return run;
}

// Walk floors 1-6 so the next available nodes are floor 7 treasure nodes.
function reachTreasure(seed: number): RunEngine {
  const run = new RunEngine(battleContent, { characterId: "jdd", seed });
  for (let floor = 1; floor <= 6; floor++) advanceFloor(run);
  return run;
}

describe("RunEngine", () => {
  it("distributes all three normal encounters across floors 1 and 2", () => {
    const expected = new Set(ACT_ONE_NORMAL_ENCOUNTERS.map((encounter) => encounter.id));

    for (const seed of [1, 7, 42, 100, 2026]) {
      const encounters = createActOneMap(seed)
        .filter((node) => node.type === "battle" && node.floor <= 2)
        .map((node) => node.encounterId!);
      expect(new Set(encounters)).toEqual(expected);
      for (const encounterId of encounters) {
        expect(battleContent.enemies[encounterId]).toBeTruthy();
      }
    }
  });

  it("never repeats the same normal enemy across a reachable floor 1 to 2 edge", () => {
    for (const seed of [1, 7, 42, 100, 2026]) {
      const nodes = createActOneMap(seed);
      const byId = new Map(nodes.map((node) => [node.id, node]));
      for (const node of nodes.filter((candidate) => candidate.floor === 1)) {
        for (const nextId of node.nextIds) {
          expect(byId.get(nextId)!.encounterId).not.toBe(node.encounterId);
        }
      }
    }
  });

  it("keeps encounter placement deterministic per seed while varying between seeds", () => {
    const placement = (seed: number) =>
      createActOneMap(seed)
        .filter((node) => node.type === "battle" && node.floor <= 2)
        .map((node) => node.encounterId);

    expect(placement(7)).toEqual(placement(7));
    expect(placement(7)).not.toEqual(placement(42));
  });

  it("starts on a branching first floor and rejects locked nodes", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    const firstFloor = run.nodes.filter((node) => node.floor === 1);
    const locked = run.nodes.find((node) => node.floor === 2)!;

    expect(run.state.availableNodeIds).toEqual(firstFloor.map((node) => node.id));
    expect(() => run.startNode(locked.id)).toThrow("Node is not reachable.");
  });

  it("carries HP and a selected card into the next map step", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    const startDeckSize = run.state.deck.length;
    run.startNode(run.state.availableNodeIds[0]);

    run.completeBattle(54);

    expect(run.state.phase).toBe("reward");
    expect(run.state.hp).toBe(54);
    expect(run.state.reward?.cardIds).toHaveLength(3);

    const selected = run.state.reward!.cardIds[0];
    run.chooseReward(selected);

    expect(run.state.phase).toBe("map");
    expect(run.state.deck).toHaveLength(startDeckSize + 1);
    expect(run.state.deck.at(-1)).toBe(selected);
    expect(run.state.availableNodeIds.length).toBeGreaterThan(0);
  });

  it("finishes the act after following a route through the boss", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });

    let act1Done = false;
    while (!act1Done) {
      if (run.state.phase === "map") {
        run.startNode(pickNonElite(run));
        continue;
      }
      if (run.state.phase === "rest") {
        run.restHeal();
        continue;
      }
      if (run.state.phase === "event") {
        run.resolveEvent(run.currentEvent()!.choices[0].id);
        continue;
      }
      if (run.state.phase === "shop") {
        run.leaveShop();
        continue;
      }
      if (run.state.phase === "treasure") {
        run.chooseTreasure(null);
        continue;
      }
      if (run.state.phase === "boss_reward") {
        expect(run.state.completedNodeIds).toHaveLength(10);
        expect(run.state.hp).toBe(42);
        run.chooseBossReward(null, null);
        act1Done = true;
        continue;
      }
      if (run.state.phase === "battle") {
        run.completeBattle(42);
        if (run.state.reward) run.chooseReward(null);
        continue;
      }
      break;
    }

    expect(run.state.act).toBe(2);
    expect(run.state.completedNodeIds).toEqual([]);
  });

  it("makes floor 9 a rest floor with no encounters", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    const floor9 = run.nodes.filter((node) => node.floor === 9);
    expect(floor9.length).toBeGreaterThan(0);
    for (const node of floor9) {
      expect(node.type).toBe("rest");
      expect(node.encounterId).toBeUndefined();
    }
  });

  it("rests to heal 25% of max HP and unlocks the boss floor", () => {
    const run = reachRest(7);
    const restId = run.state.availableNodeIds[0];
    expect(run.getNode(restId).type).toBe("rest");

    run.startNode(restId);
    expect(run.state.phase).toBe("rest");
    expect(run.state.hp).toBe(40);

    run.restHeal();

    expect(run.state.phase).toBe("map");
    expect(run.state.hp).toBe(40 + Math.floor(run.state.maxHp * 0.25));
    const nextTypes = run.state.availableNodeIds.map((id) => run.getNode(id).type);
    expect(nextTypes).toContain("boss");
  });

  it("rests to upgrade a deck card to its + variant", () => {
    const run = reachRest(7);
    run.startNode(run.state.availableNodeIds[0]);

    const target = run.upgradeableCards()[0];
    expect(target).toBeTruthy();
    const beforeCount = run.state.deck.filter((cardId) => cardId === target).length;

    run.restUpgrade(target);

    expect(run.state.phase).toBe("map");
    expect(run.state.deck.filter((cardId) => cardId === target).length).toBe(beforeCount - 1);
    expect(run.state.deck).toContain(`${target}+`);
  });

  it("makes floor 3 an event floor with no encounters", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    const floor3 = run.nodes.filter((node) => node.floor === 3);
    expect(floor3.length).toBeGreaterThan(0);
    for (const node of floor3) {
      expect(node.type).toBe("event");
      expect(node.encounterId).toBeUndefined();
    }
  });

  it("enters an event and exposes a resolvable choice set", () => {
    const run = reachEvent(7);
    const eventId = run.state.availableNodeIds[0];
    expect(run.getNode(eventId).type).toBe("event");

    run.startNode(eventId);

    expect(run.state.phase).toBe("event");
    const event = run.currentEvent();
    expect(event).toBeTruthy();
    expect(event!.choices.length).toBeGreaterThan(0);
  });

  it("applies the selected event choice and returns to the map", () => {
    const run = reachEvent(7);
    run.startNode(run.state.availableNodeIds[0]);
    const choice = run.currentEvent()!.choices[0];

    let hp = run.state.hp;
    let gold = run.state.gold;
    let deck = run.state.deck.length;
    for (const effect of choice.effects) {
      if (effect.kind === "heal") hp = Math.min(run.state.maxHp, hp + effect.amount);
      if (effect.kind === "loseHp") hp = Math.max(0, hp - effect.amount);
      if (effect.kind === "gainGold") gold += effect.amount;
      if (effect.kind === "loseGold") gold = Math.max(0, gold - effect.amount);
      if (effect.kind === "addCard") deck += 1;
    }

    run.resolveEvent(choice.id);

    expect(run.state.phase).toBe("map");
    expect(run.state.hp).toBe(hp);
    expect(run.state.gold).toBe(gold);
    expect(run.state.deck.length).toBe(deck);
    expect(run.state.event).toBeNull();
    expect(run.state.completedNodeIds.some((id) => run.getNode(id).type === "event")).toBe(true);
    const nextTypes = run.state.availableNodeIds.map((id) => run.getNode(id).type);
    expect(nextTypes.length).toBeGreaterThan(0);
    expect(nextTypes.every((type) => type === "battle")).toBe(true);
  });

  it("rejects a choice that is not part of the active event", () => {
    const run = reachEvent(7);
    run.startNode(run.state.availableNodeIds[0]);
    expect(() => run.resolveEvent("not-a-real-choice")).toThrow("Choice is not in this event.");
  });

  it("awards gold on a normal battle victory", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    const goldBefore = run.state.gold;
    run.startNode(run.state.availableNodeIds[0]);
    run.completeBattle(54);

    expect(run.state.reward?.gold).toBeGreaterThan(0);
    expect(run.state.gold).toBe(goldBefore + run.state.reward!.gold);
  });

  it("inserts two-enemy battle floors between non-combat floors", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    for (const floor of [4, 6, 8]) {
      const nodes = run.nodes.filter((node) => node.floor === floor);
      expect(nodes.length).toBeGreaterThan(0);
      for (const node of nodes) {
        expect(node.type).toBe("battle");
        expect(node.encounterIds).toHaveLength(1);
        expect(new Set(node.encounterIds).size).toBe(1);
        for (const enemyId of node.encounterIds!) {
          expect(battleContent.enemies[enemyId]).toBeTruthy();
        }
      }
    }
  });

  it("makes floor 5 a mixed shop and elite floor", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    const floor5 = run.nodes.filter((node) => node.floor === 5);
    const types = floor5.map((node) => node.type);
    expect(types).toContain("shop");
    expect(types).toContain("elite");
    const elite = floor5.find((node) => node.type === "elite");
    expect(elite).toBeTruthy();
    expect(elite!.encounterId).toBe("elite_sentinel");
    for (const node of floor5.filter((n) => n.type === "shop")) {
      expect(node.encounterId).toBeUndefined();
    }
  });

  it("opens a shop with priced stock", () => {
    const run = reachShop(7);
    const shopId = startShopNode(run);
    expect(run.getNode(shopId).type).toBe("shop");

    expect(run.state.phase).toBe("shop");
    const shop = run.currentShop();
    expect(shop).toBeTruthy();
    expect(shop!.items).toHaveLength(4);
    expect(shop!.relicItems).toHaveLength(2);
    expect(shop!.potionItems).toHaveLength(2);
    const cardRanges = {
      common: [40, 60],
      uncommon: [70, 95],
      rare: [110, 145],
    } as const;
    for (const item of shop!.items) {
      const [min, max] = cardRanges[battleContent.cards[item.cardId].rarity];
      expect(item.price).toBeGreaterThanOrEqual(min);
      expect(item.price).toBeLessThanOrEqual(max);
      expect(item.sold).toBe(false);
      expect(battleContent.cards[item.cardId]).toBeTruthy();
    }
    const relicRanges = {
      starter: [120, 160],
      common: [120, 160],
      uncommon: [170, 220],
      rare: [230, 280],
    } as const;
    for (const item of shop!.relicItems!) {
      const [min, max] = relicRanges[RELICS[item.relicId].rarity];
      expect(item.price).toBeGreaterThanOrEqual(min);
      expect(item.price).toBeLessThanOrEqual(max);
      expect(item.sold).toBe(false);
    }
    for (const item of shop!.potionItems!) {
      expect(item.price).toBeGreaterThanOrEqual(45);
      expect(item.price).toBeLessThanOrEqual(80);
      expect(POTIONS[item.potionId]).toBeTruthy();
      expect(item.sold).toBe(false);
    }
  });

  it("buys a card from the shop, spending gold and adding it to the deck", () => {
    const run = reachShop(7);
    startShopNode(run);
    run.state.gold = 999;
    const item = run.currentShop()!.items[0];
    const deckBefore = run.state.deck.length;

    run.buyShopItem(item.id);

    expect(run.state.gold).toBe(999 - item.price);
    expect(run.state.deck.length).toBe(deckBefore + 1);
    expect(run.state.deck).toContain(item.cardId);
    expect(run.currentShop()!.items.find((i) => i.id === item.id)!.sold).toBe(true);
  });

  it("rejects a purchase when gold is insufficient", () => {
    const run = reachShop(7);
    startShopNode(run);
    run.state.gold = 0;
    const item = run.currentShop()!.items[0];
    expect(() => run.buyShopItem(item.id)).toThrow("Not enough gold.");
  });

  it("buys an unowned relic, spending gold and applying its effect", () => {
    const run = reachShop(7);
    startShopNode(run);
    run.state.gold = 999;
    const item = run.currentShop()!.relicItems![0];

    run.buyShopRelic(item.id);

    expect(run.state.gold).toBe(999 - item.price);
    expect(run.hasRelic(item.relicId)).toBe(true);
    expect(item.sold).toBe(true);
    expect(() => run.buyShopRelic(item.id)).toThrow("Relic is already sold.");
  });

  it("does not stock a relic the player already owns", () => {
    const run = reachShop(7);
    run.gainRelic("reactor_core");
    startShopNode(run);

    expect(run.currentShop()!.relicItems!.map((item) => item.relicId)).not.toContain(
      "reactor_core",
    );
  });

  it("buys a potion into an open slot and rejects purchases when slots are full", () => {
    const run = reachShop(7);
    startShopNode(run);
    run.state.gold = 999;
    const [first, second] = run.currentShop()!.potionItems!;

    run.buyShopPotion(first.id);
    expect(run.state.potions).toContain(first.potionId);
    expect(first.sold).toBe(true);

    run.state.potions = Array.from({ length: MAX_POTIONS }, () => "molotov");
    const goldBefore = run.state.gold;
    expect(() => run.buyShopPotion(second.id)).toThrow("Potion slots are full.");
    expect(run.state.gold).toBe(goldBefore);
    expect(second.sold).toBe(false);
  });

  it("removes a deck card for gold, once per shop", () => {
    const run = reachShop(7);
    startShopNode(run);
    run.state.gold = 999;
    const shop = run.currentShop()!;
    const strikesBefore = run.state.deck.filter((cardId) => cardId === "strike").length;

    run.removeCard("strike");

    expect(run.state.gold).toBe(999 - shop.removalPrice);
    expect(run.state.deck.filter((cardId) => cardId === "strike").length).toBe(strikesBefore - 1);
    expect(run.currentShop()!.removalUsed).toBe(true);
    expect(() => run.removeCard("strike")).toThrow("Card removal already used.");
  });

  it("leaves the shop and unlocks the next floor", () => {
    const run = reachShop(7);
    startShopNode(run);

    run.leaveShop();

    expect(run.state.phase).toBe("map");
    expect(run.state.shop).toBeNull();
    expect(run.state.completedNodeIds.some((id) => run.getNode(id).type === "shop")).toBe(true);
    const nextTypes = run.state.availableNodeIds.map((id) => run.getNode(id).type);
    expect(nextTypes).toEqual(["battle", "battle"]);
  });

  it("an elite victory rewards higher gold (35-45) and a guaranteed relic", () => {
    const run = startEliteBattle();
    const goldBefore = run.state.gold;
    run.completeBattle(40);

    expect(run.state.phase).toBe("reward");
    expect(run.state.reward?.gold).toBeGreaterThanOrEqual(35);
    expect(run.state.reward?.gold).toBeLessThanOrEqual(45);
    expect(run.state.reward?.relicId).toBeTruthy();
    expect(run.state.gold).toBe(goldBefore + run.state.reward!.gold);
    expect(RELICS[run.state.reward!.relicId!]).toBeTruthy();
  });

  it("an elite relic is granted on reward claim regardless of card pick", () => {
    const run = startEliteBattle();
    run.completeBattle(40);
    const relicId = run.state.reward!.relicId!;
    expect(run.hasRelic(relicId)).toBe(false);

    run.chooseReward(null);

    expect(run.hasRelic(relicId)).toBe(true);
    expect(run.state.relics).toContain(relicId);
  });

  it("the elite relic is never one already owned", () => {
    const run = startEliteBattle();
    run.gainRelic("reactor_core");
    run.completeBattle(40);

    expect(run.state.reward?.relicId).toBeTruthy();
    expect(run.state.reward!.relicId).not.toBe("reactor_core");
  });

  it("makes floor 7 a treasure floor with no encounters", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    const floor7 = run.nodes.filter((node) => node.floor === 7);
    expect(floor7.length).toBeGreaterThan(0);
    for (const node of floor7) {
      expect(node.type).toBe("treasure");
      expect(node.encounterId).toBeUndefined();
    }
  });

  it("opens a treasure with up to three unowned relic choices", () => {
    const run = reachTreasure(7);
    const treasureId = run.state.availableNodeIds[0];
    expect(run.getNode(treasureId).type).toBe("treasure");

    run.startNode(treasureId);

    expect(run.state.phase).toBe("treasure");
    const treasure = run.currentTreasure();
    expect(treasure).toBeTruthy();
    expect(treasure!.relicIds.length).toBeLessThanOrEqual(3);
    expect(treasure!.relicIds.length).toBeGreaterThan(0);
    for (const id of treasure!.relicIds) {
      expect(RELICS[id]).toBeTruthy();
      expect(run.hasRelic(id)).toBe(false);
    }
  });

  it("choosing a relic grants it, applies effects, and unlocks the next floor", () => {
    const run = reachTreasure(7);
    run.startNode(run.state.availableNodeIds[0]);
    const treasure = run.currentTreasure()!;
    const choice = treasure.relicIds[0];

    run.chooseTreasure(choice);

    expect(run.state.phase).toBe("map");
    expect(run.hasRelic(choice)).toBe(true);
    expect(run.state.treasure).toBeNull();
    expect(run.state.completedNodeIds.some((id) => run.getNode(id).type === "treasure")).toBe(true);
    expect(run.battleModifiers()).toEqual(battleModifiersFor(run.state.relics));
    const nextTypes = run.state.availableNodeIds.map((id) => run.getNode(id).type);
    expect(nextTypes.length).toBeGreaterThan(0);
    expect(nextTypes.every((type) => type === "battle")).toBe(true);
  });

  it("skipping the treasure returns to the map without granting a relic", () => {
    const run = reachTreasure(7);
    run.startNode(run.state.availableNodeIds[0]);
    const ownedBefore = run.state.relics.length;

    run.chooseTreasure(null);

    expect(run.state.phase).toBe("map");
    expect(run.state.relics.length).toBe(ownedBefore);
    expect(run.state.completedNodeIds.some((id) => run.getNode(id).type === "treasure")).toBe(true);
    const nextTypes = run.state.availableNodeIds.map((id) => run.getNode(id).type);
    expect(nextTypes.length).toBeGreaterThan(0);
    expect(nextTypes.every((type) => type === "battle")).toBe(true);
  });

  it("rejects a relic that is not in the treasure", () => {
    const run = reachTreasure(7);
    run.startNode(run.state.availableNodeIds[0]);
    const treasure = run.currentTreasure()!;
    const notInTreasure = ACT_ONE_RELIC_POOL.find((id) => !treasure.relicIds.includes(id))!;

    expect(() => run.chooseTreasure(notInTreasure)).toThrow("Relic is not in this treasure.");
  });
});

describe("RunEngine relics", () => {
  it("starts with the character's starting relic and its battle modifiers", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    expect(run.state.relics).toEqual(["jdd_relic"]);
    expect(run.battleModifiers()).toEqual({ combatEnergy: 0, combatBlock: 5, combatDraw: 0, combatStrength: 0 });
  });

  it("gains a maxHp relic, raising both max and current hp", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    const maxBefore = run.state.maxHp;
    const hpBefore = run.state.hp;

    run.gainRelic("vital_implant");

    expect(run.hasRelic("vital_implant")).toBe(true);
    expect(run.state.relics).toContain("vital_implant");
    expect(run.state.maxHp).toBe(maxBefore + 14);
    expect(run.state.hp).toBe(hpBefore + 14);
  });

  it("clamps a maxHp relic heal to the new maximum", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    run.state.hp = run.state.maxHp;
    const maxBefore = run.state.maxHp;

    run.gainRelic("vital_implant");

    expect(run.state.maxHp).toBe(maxBefore + 14);
    expect(run.state.hp).toBe(run.state.maxHp);
  });

  it("aggregates combat modifiers across owned relics", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    run.gainRelic("reactor_core");
    run.gainRelic("stim_pack");

    expect(run.battleModifiers()).toEqual({ combatEnergy: 1, combatBlock: 5, combatDraw: 1, combatStrength: 0 });
  });

  it("sums multi-effect relics into the modifier totals", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    run.gainRelic("neosteel_frame");

    expect(run.battleModifiers()).toEqual({ combatEnergy: 0, combatBlock: 9, combatDraw: 1, combatStrength: 0 });
  });

  it("rejects unknown and duplicate relics", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    expect(() => run.gainRelic("nope")).toThrow("Unknown relic: nope");
    run.gainRelic("reactor_core");
    expect(() => run.gainRelic("reactor_core")).toThrow("Relic is already owned.");
  });

  it("passes relic modifiers into a run battle engine", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    run.gainRelic("reactor_core");
    run.startNode(run.state.availableNodeIds[0]);

    const battle = createRunBattle(battleContent, run);
    expect(battle.state.player.baseEnergy).toBe(3 + 1);
  });

  it("carries a maxHp relic into the battle's maxHp and hp", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    const characterMaxHp = run.state.maxHp;
    run.gainRelic("vital_implant");
    run.startNode(run.state.availableNodeIds[0]);

    const battle = createRunBattle(battleContent, run);
    expect(battle.state.player.maxHp).toBe(characterMaxHp + 14);
    expect(battle.state.player.hp).toBe(run.state.hp);
  });
});

describe("RunEngine potions", () => {
  function rewardAfterBattle(seed: number): RunEngine {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed });
    run.startNode(run.state.availableNodeIds[0]);
    run.completeBattle(54);
    return run;
  }

  it("starts with no potions", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    expect(run.state.potions).toEqual([]);
  });

  it("takes a reward potion into an open slot and clears the offer", () => {
    const run = rewardAfterBattle(7);
    run.state.reward!.potionId = "molotov";

    run.takeRewardPotion();

    expect(run.state.potions).toEqual(["molotov"]);
    expect(run.state.reward!.potionId).toBeUndefined();
    expect(() => run.takeRewardPotion()).toThrow("No potion to take.");
  });

  it("rejects taking a potion when both slots are full", () => {
    const run = rewardAfterBattle(7);
    run.state.potions = ["molotov", "vigor_shot"];
    run.state.reward!.potionId = "molotov";

    expect(() => run.takeRewardPotion()).toThrow("Potion slots are full.");
  });

  it("removes used potion slots, highest index first", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    run.state.potions = ["molotov", "vigor_shot"];

    run.removePotions([0]);
    expect(run.state.potions).toEqual(["vigor_shot"]);

    run.state.potions = ["molotov", "vigor_shot"];
    run.removePotions([0, 1]);
    expect(run.state.potions).toEqual([]);
  });

  it("only ever offers a known potion as a battle reward", () => {
    for (const seed of [1, 7, 42, 100, 2026]) {
      const run = rewardAfterBattle(seed);
      const potionId = run.state.reward?.potionId;
      if (potionId) expect(ACT_ONE_POTION_POOL).toContain(potionId);
    }
  });
});
