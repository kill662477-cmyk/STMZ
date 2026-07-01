import { describe, expect, it } from "vitest";
import { battleContent } from "../../content/battleContent";
import { RunEngine } from "./RunEngine";
import { createActThreeMap } from "./actThree";

// 두 막의 보스를 연속으로 처치해 act 3에 진입한다.
function reachActThree(run: RunEngine): void {
  // act 1 → act 2
  const boss1 = run.nodes.find((n) => n.type === "boss")!;
  run.state.availableNodeIds = [boss1.id];
  run.startNode(boss1.id);
  run.completeBattle(50);
  if (run.state.phase === "boss_reward") run.chooseBossReward(null, null);

  // act 2 → act 3
  const boss2 = run.nodes.find((n) => n.type === "boss")!;
  run.state.availableNodeIds = [boss2.id];
  run.startNode(boss2.id);
  run.completeBattle(50);
  if (run.state.phase === "boss_reward") run.chooseBossReward(null, null);
}

describe("Act 3 map", () => {
  it("builds a 10-floor interleaved act-3 map with the interstellar battleship boss", () => {
    const nodes = createActThreeMap(7);
    const floors = new Set(nodes.map((n) => n.floor));
    expect([...floors].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(nodes.every((n) => n.id.startsWith("a3-"))).toBe(true);
    expect(nodes.every((n) => n.act === 3)).toBe(true);

    const boss = nodes.filter((n) => n.floor === 10);
    expect(boss).toHaveLength(1);
    expect(boss[0].type).toBe("boss");
    expect(boss[0].encounterId).toBe("interstellar_battleship");

    expect(nodes.filter((n) => n.floor === 3).every((n) => n.type === "event")).toBe(true);
    for (const floor of [4, 6, 8]) {
      expect(nodes.filter((n) => n.floor === floor).every((n) => n.encounterIds?.length === 1)).toBe(true);
    }
    const f5 = nodes.filter((n) => n.floor === 5).map((n) => n.type);
    expect(f5).toContain("shop");
    expect(f5).toContain("elite");
    expect(nodes.filter((n) => n.floor === 7).every((n) => n.type === "treasure")).toBe(true);
    expect(nodes.filter((n) => n.floor === 9).every((n) => n.type === "rest")).toBe(true);
  });

  it("registers complete act-3 enemy and boss definitions", () => {
    for (const id of ["interceptor", "fire_support", "abyssal_cluster", "battleship_escort"]) {
      const enemy = battleContent.enemies[id];
      expect(enemy, id).toBeTruthy();
      expect(enemy.tier).toBe("normal");
      for (const actionId of enemy.pattern) expect(enemy.actions[actionId], `${id}.${actionId}`).toBeTruthy();
    }
    const boss = battleContent.enemies.interstellar_battleship;
    expect(boss.tier).toBe("boss");
    expect(boss.maxHp).toBeGreaterThan(battleContent.enemies.abyssal_charger.maxHp);
    for (const actionId of boss.pattern) expect(boss.actions[actionId]).toBeTruthy();
  });
});

describe("multi-act transition to act 3", () => {
  it("advances to act 3 on the act-2 boss kill, carrying progress over", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    run.gainRelic("reactor_core");
    run.state.gold = 200;
    run.state.potions = ["molotov"];
    run.state.deck.push("bash");
    const carriedDeck = [...run.state.deck];

    reachActThree(run);

    expect(run.state.act).toBe(3);
    expect(run.state.phase).toBe("map");
    expect(run.nodes.every((n) => n.id.startsWith("a3-"))).toBe(true);
    expect(run.state.availableNodeIds.length).toBeGreaterThan(0);
    expect(run.state.availableNodeIds.every((id) => run.getNode(id).floor === 1)).toBe(true);
    expect(run.state.completedNodeIds).toEqual([]);
    expect(run.state.currentNodeId).toBeNull();
    expect(run.state.relics).toContain("reactor_core");
    expect(run.state.potions).toEqual(["molotov"]);
    expect(run.state.deck).toEqual(carriedDeck);
  });

  it("wins the whole run only after the act-3 final boss", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 13 });

    reachActThree(run);
    expect(run.state.act).toBe(3);
    expect(run.state.phase).toBe("map");

    // act 3 (final) boss → won
    const boss3 = run.nodes.find((n) => n.type === "boss")!;
    run.state.availableNodeIds = [boss3.id];
    run.startNode(boss3.id);
    run.completeBattle(50);
    expect(run.state.phase).toBe("won");
    expect(run.state.availableNodeIds).toEqual([]);
  });

  it("round-trips an act-3 save through RunEngine.restore", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    reachActThree(run);

    const restored = RunEngine.restore(battleContent, run.state);

    expect(restored.state.act).toBe(3);
    expect(restored.state.phase).toBe("map");
    expect(restored.nodes.every((n) => n.id.startsWith("a3-"))).toBe(true);
    expect(restored.state).toEqual(run.state);
    restored.state.deck.push("strike");
    expect(restored.state.deck).not.toEqual(run.state.deck);
  });

  it("can start an act-3 battle through the run battle factory", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    reachActThree(run);
    const battleNode = run.state.availableNodeIds
      .map((id) => run.getNode(id))
      .find((n) => n.type === "battle");
    expect(battleNode).toBeTruthy();
    run.startNode(battleNode!.id);
    expect(run.state.phase).toBe("battle");
    expect(run.currentNode?.encounterId).toBeTruthy();
    expect(battleContent.enemies[run.currentNode!.encounterId!]).toBeTruthy();
  });
});
