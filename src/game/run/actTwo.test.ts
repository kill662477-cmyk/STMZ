import { describe, expect, it } from "vitest";
import { battleContent } from "../../content/battleContent";
import { RunEngine } from "./RunEngine";
import { createActTwoMap } from "./actTwo";

// 보스 노드를 도달 가능하게 만들고 승리시켜 막을 끝낸다.
// 1·2막 보스는 boss_reward 단계를 거치므로 보상을 건너뛰고 막을 전환한다.
function winCurrentActBoss(run: RunEngine, hp = 40): void {
  const boss = run.nodes.find((n) => n.type === "boss");
  if (!boss) throw new Error("test setup: no boss node");
  run.state.availableNodeIds = [boss.id];
  run.startNode(boss.id);
  run.completeBattle(hp);
  if (run.state.phase === "boss_reward") run.chooseBossReward(null, null);
}

describe("Act 2 map", () => {
  it("builds a 10-floor interleaved act-2 map with the abyssal charger boss", () => {
    const nodes = createActTwoMap(7);
    const floors = new Set(nodes.map((n) => n.floor));
    expect([...floors].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(nodes.every((n) => n.id.startsWith("a2-"))).toBe(true);
    expect(nodes.every((n) => n.act === 2)).toBe(true);

    const boss = nodes.filter((n) => n.floor === 10);
    expect(boss).toHaveLength(1);
    expect(boss[0].type).toBe("boss");
    expect(boss[0].encounterId).toBe("abyssal_charger");

    // 3 이벤트 / 4 2체전 / 5 상점+엘리트 / 6 2체전 /
    // 7 보물 / 8 2체전 / 9 휴식 / 10 보스.
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

  it("registers complete act-2 enemy and boss definitions", () => {
    for (const id of ["void_stalker", "siege_marauder", "chitin_brute", "resonance_warden"]) {
      const enemy = battleContent.enemies[id];
      expect(enemy, id).toBeTruthy();
      expect(enemy.tier).toBe("normal");
      for (const actionId of enemy.pattern) expect(enemy.actions[actionId], `${id}.${actionId}`).toBeTruthy();
    }
    const boss = battleContent.enemies.abyssal_charger;
    expect(boss.tier).toBe("boss");
    expect(boss.maxHp).toBeGreaterThan(battleContent.enemies.brood_queen.maxHp); // 2막 보스가 더 강함
    for (const actionId of boss.pattern) expect(boss.actions[actionId]).toBeTruthy();
  });
});

describe("multi-act transition", () => {
  it("advances to act 2 on the act-1 boss kill, carrying progress over", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    run.gainRelic("reactor_core");
    run.state.gold = 200;
    run.state.potions = ["molotov"];
    run.state.deck.push("bash");
    const carriedHp = 40;
    const carriedDeck = [...run.state.deck];

    winCurrentActBoss(run, carriedHp);

    expect(run.state.act).toBe(2);
    expect(run.state.phase).toBe("map");
    expect(run.nodes.every((n) => n.id.startsWith("a2-"))).toBe(true);
    // 새 막의 1층이 열려 있다.
    expect(run.state.availableNodeIds.length).toBeGreaterThan(0);
    expect(run.state.availableNodeIds.every((id) => run.getNode(id).floor === 1)).toBe(true);
    expect(run.state.completedNodeIds).toEqual([]);
    expect(run.state.currentNodeId).toBeNull();
    // 진행물 유지: HP·골드·덱·유물·포션.
    expect(run.state.hp).toBe(carriedHp);
    expect(run.state.gold).toBe(200);
    expect(run.state.relics).toContain("reactor_core");
    expect(run.state.potions).toEqual(["molotov"]);
    expect(run.state.deck).toEqual(carriedDeck);
  });

  it("wins the whole run only after the final-act boss", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 13 });

    winCurrentActBoss(run, 50); // act 1 boss → act 2
    expect(run.state.phase).toBe("map");
    expect(run.state.act).toBe(2);

    winCurrentActBoss(run, 50); // act 2 boss → act 3
    expect(run.state.phase).toBe("map");
    expect(run.state.act).toBe(3);

    winCurrentActBoss(run, 50); // act 3 (final) boss → won
    expect(run.state.phase).toBe("won");
    expect(run.state.availableNodeIds).toEqual([]);
  });

  it("round-trips an act-2 save through RunEngine.restore", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    winCurrentActBoss(run, 55); // now in act 2 on the map

    const restored = RunEngine.restore(battleContent, run.state);

    expect(restored.state.act).toBe(2);
    expect(restored.state.phase).toBe("map");
    expect(restored.nodes.every((n) => n.id.startsWith("a2-"))).toBe(true);
    expect(restored.state).toEqual(run.state);
    // 깊은 복사 확인.
    restored.state.deck.push("strike");
    expect(restored.state.deck).not.toEqual(run.state.deck);
  });

  it("can start an act-2 battle through the run battle factory", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    winCurrentActBoss(run, 60);
    // 2막 1층 전투 노드 진입.
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
