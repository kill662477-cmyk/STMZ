import { BattleEngine } from "../engine/BattleEngine";
import type { BattleContent } from "../engine/types";
import { RunEngine } from "./RunEngine";

export function createRunBattle(content: BattleContent, run: RunEngine): BattleEngine {
  if (run.state.phase !== "battle") {
    throw new Error("Run is not ready to start a battle.");
  }

  const node = run.currentNode;
  if (!node?.encounterId) {
    throw new Error("Active run node has no encounter.");
  }

  const ascension = run.state.ascension ?? 1;
  let multiplier = 1.0;
  if (ascension === 2) multiplier = 1.1;
  if (ascension === 3) multiplier = 1.25;
  if (ascension === 4) multiplier = 1.4;
  if (ascension === 5) multiplier = 1.6;

  let battleContent = content;
  if (multiplier > 1.0) {
    const scaledEnemies = { ...content.enemies };
    for (const [id, def] of Object.entries(scaledEnemies)) {
      const scaledActions = { ...def.actions };
      for (const [actionId, action] of Object.entries(scaledActions)) {
        scaledActions[actionId] = {
          ...action,
          effects: action.effects.map((effect) => {
            if (effect.kind === "damage" || effect.kind === "block") {
              return { ...effect, amount: Math.floor(effect.amount * multiplier) };
            }
            return effect;
          }),
        };
      }
      scaledEnemies[id] = {
        ...def,
        maxHp: Math.floor(def.maxHp * multiplier),
        actions: scaledActions,
      };
    }
    battleContent = { ...content, enemies: scaledEnemies };
  }

  return new BattleEngine(battleContent, {
    characterId: run.state.characterId,
    enemyIds: node.encounterIds ?? [node.encounterId],
    seed: run.battleSeed(),
    playerHp: run.state.hp,
    playerMaxHp: run.state.maxHp,
    deck: run.state.deck,
    mods: run.battleModifiers(),
  });
}

export function resolveRunBattle(run: RunEngine, battle: BattleEngine): void {
  const node = run.currentNode;
  const expected = node?.encounterIds ?? (node?.encounterId ? [node.encounterId] : []);
  const actual = battle.state.enemies.map((enemy) => enemy.definitionId);
  if (expected.length === 0 || expected.length !== actual.length || expected.some((id, index) => id !== actual[index])) {
    throw new Error("Battle does not match the active run node.");
  }

  if (battle.state.phase === "won") {
    run.completeBattle(battle.state.player.hp);
    return;
  }

  if (battle.state.phase === "lost") {
    run.failBattle();
    return;
  }

  throw new Error("Battle has not ended.");
}
