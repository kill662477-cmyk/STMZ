import { describe, expect, it } from "vitest";
import { battleContent } from "../../content/battleContent";
import { BattleEngine, type BattleEvent } from "./BattleEngine";

function damageEvent(events: BattleEvent[]) {
  const event = events.find(
    (candidate): candidate is Extract<BattleEvent, { type: "damage" }> =>
      candidate.type === "damage",
  );
  if (!event) throw new Error("Expected a damage event.");
  return event;
}

function engineWithDoubleShot() {
  const engine = new BattleEngine(battleContent, {
    characterId: "jdd",
    enemyId: "sentinel_scout",
    seed: 7,
  });
  engine.state.player.hand = [{ instanceId: "test-doubleshot", cardId: "doubleshot" }];
  return engine;
}

describe("BattleEngine damage events", () => {
  it("keeps each hit amount for a multi-hit attack", () => {
    const engine = engineWithDoubleShot();

    const event = damageEvent(engine.playCard("test-doubleshot"));

    expect(event.amount).toBe(6);
    expect(event.hits).toBe(2);
    expect(event.hitAmounts).toEqual([3, 3]);
  });

  it("preserves per-hit block absorption", () => {
    const engine = engineWithDoubleShot();
    engine.state.enemy.block = 5;

    const event = damageEvent(engine.playCard("test-doubleshot"));

    expect(event.amount).toBe(1);
    expect(event.hitAmounts).toEqual([0, 1]);
  });
});

describe("BattleEngine normal enemy patterns", () => {
  it("registers three complete normal encounter definitions", () => {
    for (const enemyId of ["sentinel_scout", "wasteland_gunner", "acid_stalker"]) {
      const enemy = battleContent.enemies[enemyId];
      expect(enemy).toBeTruthy();
      expect(enemy.tier).toBe("normal");
      expect(enemy.pattern.length).toBeGreaterThan(0);
      for (const actionId of enemy.pattern) {
        expect(enemy.actions[actionId]).toBeTruthy();
      }
    }
  });

  it("makes the wasteland gunner open with a two-hit burst", () => {
    const engine = new BattleEngine(battleContent, {
      characterId: "jdd",
      enemyId: "wasteland_gunner",
      seed: 7,
    });

    expect(engine.getIntent()).toMatchObject({ intent: "attack", damage: 6, hits: 2 });
    const event = damageEvent(engine.endPlayerTurn());

    expect(event.amount).toBe(12);
    expect(event.hitAmounts).toEqual([6, 6]);
  });

  it("makes the acid stalker mark the player before its amplified strike", () => {
    const engine = new BattleEngine(battleContent, {
      characterId: "jdd",
      enemyId: "acid_stalker",
      seed: 7,
    });

    engine.endPlayerTurn();
    expect(engine.state.player.statuses.vulnerable).toBe(2);
    expect(engine.getIntent()).toMatchObject({ intent: "attack", damage: 14, hits: 1 });

    const event = damageEvent(engine.endPlayerTurn());
    expect(event.amount).toBe(21);
  });
});

describe("BattleEngine two-enemy encounters", () => {
  it("lets both living enemies act during the same enemy turn", () => {
    const engine = new BattleEngine(battleContent, {
      characterId: "jdd",
      enemyIds: ["wasteland_gunner", "wasteland_gunner"],
      seed: 7,
    });
    const hpBefore = engine.state.player.hp;

    const events = engine.endPlayerTurn();
    const enemyDamage = events.filter(
      (event): event is Extract<BattleEvent, { type: "damage" }> =>
        event.type === "damage" && event.target === "player",
    );

    expect(enemyDamage).toHaveLength(2);
    expect(enemyDamage.map((event) => event.enemyIndex)).toEqual([0, 1]);
    expect(engine.state.player.hp).toBe(hpBefore - 24);
  });

  it("moves focus to the second enemy and wins only after both are defeated", () => {
    const engine = new BattleEngine(battleContent, {
      characterId: "jdd",
      enemyIds: ["sentinel_scout", "acid_stalker"],
      seed: 7,
    });
    engine.state.enemies[0].hp = 1;
    engine.state.enemies[1].hp = 1;
    engine.state.player.hand = [{ instanceId: "first", cardId: "strike" }];

    const firstEvents = engine.playCard("first");

    expect(firstEvents).toContainEqual({ type: "defeat", enemyIndex: 0 });
    expect(engine.state.phase).toBe("player");
    expect(engine.state.activeEnemyIndex).toBe(1);
    expect(engine.state.enemy).toBe(engine.state.enemies[1]);

    engine.state.player.hand = [{ instanceId: "second", cardId: "strike" }];
    const secondEvents = engine.playCard("second");

    expect(secondEvents).toContainEqual({ type: "defeat", enemyIndex: 1 });
    expect(secondEvents.some((event) => event.type === "win")).toBe(true);
    expect(engine.state.phase).toBe("won");
  });
});

describe("BattleEngine card mechanics", () => {
  function freshEngine() {
    return new BattleEngine(battleContent, {
      characterId: "jdd",
      enemyId: "sentinel_scout",
      seed: 7,
    });
  }

  it("adrenaline gains energy, draws cards, and exhausts", () => {
    const engine = freshEngine();
    const p = engine.state.player;
    p.hand = [{ instanceId: "a", cardId: "adrenaline" }];
    const energyBefore = p.energy;
    const drawBefore = p.drawPile.length;

    engine.playCard("a");

    expect(p.energy).toBe(energyBefore + 1);
    expect(p.hand).toHaveLength(2);
    expect(p.drawPile.length).toBe(drawBefore - 2);
    expect(p.exhaustPile.map((c) => c.cardId)).toContain("adrenaline");
    expect(p.discardPile.map((c) => c.cardId)).not.toContain("adrenaline");
  });

  it("empower strength scales every hit and persists across turns", () => {
    const engine = freshEngine();
    engine.state.player.hand = [
      { instanceId: "e", cardId: "empower" },
      { instanceId: "d", cardId: "doubleshot" },
    ];

    engine.playCard("e");
    expect(engine.state.player.statuses.strength).toBe(2);

    const event = damageEvent(engine.playCard("d")); // 3×2, +2 힘/타격 => 5,5
    expect(event.hitAmounts).toEqual([5, 5]);
    expect(event.amount).toBe(10);

    engine.endPlayerTurn();
    expect(engine.state.player.statuses.strength).toBe(2); // 파워는 감소하지 않음
  });
});

describe("BattleEngine potions", () => {
  function freshEngine() {
    return new BattleEngine(battleContent, {
      characterId: "jdd",
      enemyId: "sentinel_scout",
      seed: 7,
    });
  }

  it("uses an attack potion to damage the enemy", () => {
    const engine = freshEngine();
    const hpBefore = engine.state.enemy.hp;

    const event = damageEvent(engine.usePotion({ kind: "damage", amount: 12 }));

    expect(event.amount).toBe(12);
    expect(engine.state.enemy.hp).toBe(hpBefore - 12);
  });

  it("uses a skill potion to gain energy without ending the turn", () => {
    const engine = freshEngine();
    const energyBefore = engine.state.player.energy;

    const events = engine.usePotion({ kind: "energy", amount: 2 });

    expect(events).toContainEqual({ type: "potion", effect: "energy", amount: 2 });
    expect(engine.state.player.energy).toBe(energyBefore + 2);
    expect(engine.state.phase).toBe("player");
  });

  it("reports the actual cards drawn by a potion", () => {
    const engine = freshEngine();
    const handBefore = engine.state.player.hand.length;

    const events = engine.usePotion({ kind: "draw", amount: 2 });

    expect(events).toContainEqual({ type: "potion", effect: "draw", amount: 2 });
    expect(engine.state.player.hand).toHaveLength(handBefore + 2);
  });

  it("reports actual healing and caps it at max hp", () => {
    const engine = freshEngine();
    engine.state.player.hp = engine.state.player.maxHp - 3;

    const healed = engine.usePotion({ kind: "heal", amount: 8 });
    const alreadyFull = engine.usePotion({ kind: "heal", amount: 8 });

    expect(healed).toContainEqual({ type: "potion", effect: "heal", amount: 3 });
    expect(alreadyFull).toContainEqual({ type: "potion", effect: "heal", amount: 0 });
    expect(engine.state.player.hp).toBe(engine.state.player.maxHp);
  });

  it("wins the battle when a potion lands the killing blow", () => {
    const engine = freshEngine();
    engine.state.enemy.hp = 5;

    const events = engine.usePotion({ kind: "damage", amount: 12 });

    expect(engine.state.phase).toBe("won");
    expect(events.some((event) => event.type === "win")).toBe(true);
  });
});

describe("BattleEngine relic modifiers", () => {
  it("grants extra energy and draw every turn", () => {
    const engine = new BattleEngine(battleContent, {
      characterId: "jdd",
      enemyId: "sentinel_scout",
      seed: 7,
      mods: { combatEnergy: 1, combatBlock: 0, combatDraw: 1, combatStrength: 0 },
    });

    expect(engine.state.player.baseEnergy).toBe(3 + 1);
    expect(engine.state.player.energy).toBe(4);
    expect(engine.state.player.hand).toHaveLength(5 + 1);

    engine.endPlayerTurn(); // 적 행동 후 2턴 시작

    expect(engine.state.player.energy).toBe(4);
    expect(engine.state.player.hand).toHaveLength(5 + 1);
  });

  it("grants combat block only on the first turn", () => {
    const engine = new BattleEngine(battleContent, {
      characterId: "jdd",
      enemyId: "sentinel_scout",
      seed: 7,
      mods: { combatEnergy: 0, combatBlock: 6, combatDraw: 0, combatStrength: 0 },
    });

    expect(engine.state.player.block).toBe(6);

    engine.endPlayerTurn();

    expect(engine.state.player.block).toBe(0);
  });
});
