import { describe, expect, it } from "vitest";
import { battleContent } from "../../content/battleContent";
import { RunEngine } from "./RunEngine";
import { createRunBattle, resolveRunBattle } from "./runBattle";

describe("run battle integration", () => {
  it("passes the run HP, deck, encounter, and seed into battle", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7 });
    run.startNode(run.state.availableNodeIds[0]);
    run.completeBattle(54);
    const rewardCard = run.state.reward!.cardIds[0];
    run.chooseReward(rewardCard);

    run.startNode(run.state.availableNodeIds[0]);
    const battle = createRunBattle(battleContent, run);
    const battleDeck = [
      ...battle.state.player.hand,
      ...battle.state.player.drawPile,
      ...battle.state.player.discardPile,
    ];

    expect(battle.state.player.hp).toBe(54);
    expect(battleDeck.some((card) => card.cardId === rewardCard)).toBe(true);
    expect(battle.state.enemy.definitionId).toBe(run.currentNode?.encounterId);
  });

  it("returns remaining HP to the run and opens a reward", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 11 });
    run.startNode(run.state.availableNodeIds[0]);
    const battle = createRunBattle(battleContent, run);
    battle.state.player.hp = 57;
    battle.state.phase = "won";

    resolveRunBattle(run, battle);

    expect(run.state.phase).toBe("reward");
    expect(run.state.hp).toBe(57);
    expect(run.state.reward?.sourceNodeId).toBe(run.currentNode?.id);
  });

  it("turns a battle loss into a lost run", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 13 });
    run.startNode(run.state.availableNodeIds[0]);
    const battle = createRunBattle(battleContent, run);
    battle.state.phase = "lost";

    resolveRunBattle(run, battle);

    expect(run.state.phase).toBe("lost");
    expect(run.state.hp).toBe(0);
  });

  it("creates inserted battle floors with both configured existing enemies", () => {
    const run = new RunEngine(battleContent, { characterId: "jdd", seed: 7, ascension: 2 });
    const duoNode = run.nodes.find((node) => node.floor === 4 && node.encounterIds?.length === 2)!;
    run.state.availableNodeIds = [duoNode.id];
    run.startNode(duoNode.id);

    const battle = createRunBattle(battleContent, run);

    expect(battle.state.enemies.map((enemy) => enemy.definitionId)).toEqual(
      duoNode.encounterIds,
    );
    expect(battle.state.enemies).toHaveLength(2);
  });
});
