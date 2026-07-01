import { describe, expect, it } from "vitest";
import { battleContent } from "../../content/battleContent";
import { createRunBattle } from "./runBattle";
import { RunEngine } from "./RunEngine";
import {
  RUN_SAVE_KEY,
  clearRunSave,
  loadRun,
  saveRun,
  type RunStorage,
} from "./runPersistence";

class MemoryStorage implements RunStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe("run persistence", () => {
  it("round-trips map progress without sharing mutable state", () => {
    const storage = new MemoryStorage();
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    run.startNode(run.state.availableNodeIds[0]);
    run.completeBattle(47);
    run.chooseReward(run.state.reward!.cardIds[0]);
    saveRun(storage, run.state, new Date("2026-06-28T12:00:00.000Z"));

    const loaded = loadRun(storage, battleContent);

    expect(loaded?.savedAt).toBe("2026-06-28T12:00:00.000Z");
    expect(loaded?.run.state).toEqual(run.state);
    loaded!.run.state.deck.push("guard");
    expect(loaded!.run.state.deck).not.toEqual(run.state.deck);
  });

  it("restores a battle at its original start state", () => {
    const storage = new MemoryStorage();
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 19 });
    run.state.hp = 51;
    run.startNode(run.state.availableNodeIds[0]);
    const originalBattle = createRunBattle(battleContent, run);
    saveRun(storage, run.state);

    originalBattle.endPlayerTurn();
    const loaded = loadRun(storage, battleContent)!;
    const restoredBattle = createRunBattle(battleContent, loaded.run);

    expect(loaded.run.state.phase).toBe("battle");
    expect(restoredBattle.state.player.hp).toBe(51);
    expect(restoredBattle.state.turn).toBe(1);
    expect(restoredBattle.state.player.drawPile).toEqual(
      createRunBattle(battleContent, loaded.run).state.player.drawPile,
    );
  });

  it("preserves card, relic, and potion shop transactions", () => {
    const storage = new MemoryStorage();
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    const shopNode = run.nodes.find((node) => node.type === "shop")!;
    run.state.availableNodeIds = [shopNode.id];
    run.state.gold = 999;
    run.startNode(shopNode.id);
    const shop = run.currentShop()!;
    const cardItem = shop.items[0];
    const relicItem = shop.relicItems![0];
    const potionItem = shop.potionItems![0];
    run.buyShopItem(cardItem.id);
    run.buyShopRelic(relicItem.id);
    run.buyShopPotion(potionItem.id);
    saveRun(storage, run.state);

    const loaded = loadRun(storage, battleContent)!;

    expect(loaded.run.state.phase).toBe("shop");
    expect(loaded.run.currentShop()!.items.find((entry) => entry.id === cardItem.id)?.sold).toBe(true);
    expect(loaded.run.currentShop()!.relicItems!.find((entry) => entry.id === relicItem.id)?.sold).toBe(true);
    expect(loaded.run.currentShop()!.potionItems!.find((entry) => entry.id === potionItem.id)?.sold).toBe(true);
    expect(loaded.run.state.deck.at(-1)).toBe(cardItem.cardId);
    expect(loaded.run.state.relics).toContain(relicItem.relicId);
    expect(loaded.run.state.potions).toContain(potionItem.potionId);
    expect(loaded.run.state.gold).toBe(
      999 - cardItem.price - relicItem.price - potionItem.price,
    );
  });

  it("loads legacy version-1 shop saves without mixed stock fields", () => {
    const storage = new MemoryStorage();
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    const shopNode = run.nodes.find((node) => node.type === "shop")!;
    run.state.availableNodeIds = [shopNode.id];
    run.startNode(shopNode.id);
    saveRun(storage, run.state);
    const saved = JSON.parse(storage.getItem(RUN_SAVE_KEY)!);
    delete saved.state.shop.relicItems;
    delete saved.state.shop.potionItems;
    storage.setItem(RUN_SAVE_KEY, JSON.stringify(saved));

    const loaded = loadRun(storage, battleContent);

    expect(loaded?.run.state.phase).toBe("shop");
    expect(loaded?.run.currentShop()?.items).toHaveLength(4);
    expect(loaded?.run.currentShop()?.relicItems).toBeUndefined();
    expect(loaded?.run.currentShop()?.potionItems).toBeUndefined();
  });

  it("adds the character signature card to a legacy save without changing deck size", () => {
    const storage = new MemoryStorage();
    const run = new RunEngine(battleContent, { characterId: "ample", seed: 7 });
    run.state.deck[run.state.deck.indexOf("ample_signature")] = "strike";
    const legacyDeckSize = run.state.deck.length;
    saveRun(storage, run.state);

    const loaded = loadRun(storage, battleContent)!;

    expect(loaded.run.state.deck).toHaveLength(legacyDeckSize);
    expect(loaded.run.state.deck).toContain("ample_signature");
    expect(loaded.run.state.deck.filter((cardId) => cardId === "strike")).toHaveLength(3);
  });

  it("rejects unknown mixed shop content", () => {
    const storage = new MemoryStorage();
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    const shopNode = run.nodes.find((node) => node.type === "shop")!;
    run.state.availableNodeIds = [shopNode.id];
    run.startNode(shopNode.id);
    saveRun(storage, run.state);
    const saved = JSON.parse(storage.getItem(RUN_SAVE_KEY)!);
    saved.state.shop.relicItems[0].relicId = "not-a-relic";
    storage.setItem(RUN_SAVE_KEY, JSON.stringify(saved));

    expect(loadRun(storage, battleContent)).toBeNull();
    expect(storage.getItem(RUN_SAVE_KEY)).toBeNull();
  });

  it("round-trips held potions and rejects an unknown potion id", () => {
    const storage = new MemoryStorage();
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    run.state.potions = ["molotov", "vigor_shot"];
    saveRun(storage, run.state);

    const loaded = loadRun(storage, battleContent);
    expect(loaded?.run.state.potions).toEqual(["molotov", "vigor_shot"]);

    const saved = JSON.parse(storage.getItem(RUN_SAVE_KEY)!);
    saved.state.potions = ["not-a-real-potion"];
    storage.setItem(RUN_SAVE_KEY, JSON.stringify(saved));

    expect(loadRun(storage, battleContent)).toBeNull();
    expect(storage.getItem(RUN_SAVE_KEY)).toBeNull();
  });

  it("discards corrupt or unsupported saves instead of crashing", () => {
    const storage = new MemoryStorage();
    storage.setItem(RUN_SAVE_KEY, JSON.stringify({ saveVersion: 999, state: {} }));

    expect(loadRun(storage, battleContent)).toBeNull();
    expect(storage.getItem(RUN_SAVE_KEY)).toBeNull();
  });

  it("treats a blocked storage read as no saved run", () => {
    const blockedStorage: RunStorage = {
      getItem: () => {
        throw new Error("storage blocked");
      },
      setItem: () => undefined,
      removeItem: () => undefined,
    };

    expect(loadRun(blockedStorage, battleContent)).toBeNull();
  });

  it("discards a structurally valid save with a mismatched source node", () => {
    const storage = new MemoryStorage();
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    run.startNode(run.state.availableNodeIds[0]);
    run.completeBattle(44);
    saveRun(storage, run.state);
    const saved = JSON.parse(storage.getItem(RUN_SAVE_KEY)!);
    saved.state.reward.sourceNodeId = "missing-node";
    storage.setItem(RUN_SAVE_KEY, JSON.stringify(saved));

    expect(loadRun(storage, battleContent)).toBeNull();
    expect(storage.getItem(RUN_SAVE_KEY)).toBeNull();
  });

  it("discards saves that belong to retired characters", () => {
    const storage = new MemoryStorage();
    const run = new RunEngine(battleContent, { characterId: "hyeonje", seed: 7 });
    saveRun(storage, run.state);
    const saved = JSON.parse(storage.getItem(RUN_SAVE_KEY)!);
    saved.state.characterId = "pado";
    storage.setItem(RUN_SAVE_KEY, JSON.stringify(saved));

    expect(loadRun(storage, battleContent)).toBeNull();
    expect(storage.getItem(RUN_SAVE_KEY)).toBeNull();
  });

  it("clears a saved run", () => {
    const storage = new MemoryStorage();
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    saveRun(storage, run.state);

    clearRunSave(storage);

    expect(loadRun(storage, battleContent)).toBeNull();
  });
});
