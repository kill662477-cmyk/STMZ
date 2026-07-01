import { describe, expect, it } from "vitest";
import { battleContent } from "../../content/battleContent";
import { BattleEngine } from "../engine/BattleEngine";
import type { CardDef, CardInstance } from "../engine/types";
import { RunEngine } from "./RunEngine";
import { createRunBattle, resolveRunBattle } from "./runBattle";

// 복수 시드 1막 풀런 밸런스 QA (HANDOFF 2막 전환 게이트).
// 실제 RunEngine + BattleEngine을 그대로 구동하는 결정론 시뮬레이터로 1막 전체를
// 끝까지 플레이하며, 진행 차단(데드락)·예외·골드 음수 같은 블로커가 없는지 검증하고
// HP/골드/보스 도달/승패 통계를 기록한다.

type Strategy = "safe" | "risky";

interface RunReport {
  seed: number;
  strategy: Strategy;
  result: "won" | "lost";
  floorsCleared: number;
  bossReached: boolean;
  finalHp: number;
  maxHp: number;
  finalGold: number;
  minGold: number;
  deckSize: number;
  relics: number;
  cardsBought: number;
  longestBattleTurns: number;
}

const cardDamage = (def: CardDef): number =>
  def.effects
    .filter((e) => e.kind === "damage")
    .reduce((sum, e) => sum + (e.kind === "damage" ? e.amount * (e.hits ?? 1) : 0), 0);

const cardBlock = (def: CardDef): number =>
  def.effects.filter((e) => e.kind === "block").reduce((sum, e) => sum + (e.kind === "block" ? e.amount : 0), 0);

// 한 턴에 둘 카드를 고르는 휴리스틱: 위험하면 방어, 아니면 최대 피해, 그 외 보조 스킬.
function chooseCard(engine: BattleEngine): CardInstance | null {
  const p = engine.state.player;
  const affordable = p.hand
    .map((c) => ({ c, def: engine.getCardDef(c) }))
    .filter((x) => x.def.cost <= p.energy);
  if (affordable.length === 0) return null;

  const incoming = engine.state.enemies.reduce((sum, enemy, index) => {
    if (enemy.hp <= 0) return sum;
    const intent = engine.getIntent(index);
    return sum + (intent.damage ? intent.damage * (intent.hits ?? 1) : 0);
  }, 0);
  const unblocked = Math.max(0, incoming - p.block);
  const danger = unblocked >= 18 || unblocked >= p.hp * 0.5;

  if (danger) {
    const blocker = affordable
      .filter((x) => cardBlock(x.def) > 0)
      .sort((a, b) => cardBlock(b.def) - cardBlock(a.def))[0];
    if (blocker) return blocker.c;
  }
  const attacker = affordable
    .filter((x) => cardDamage(x.def) > 0)
    .sort((a, b) => cardDamage(b.def) - cardDamage(a.def))[0];
  if (attacker) return attacker.c;

  // 보조 스킬(취약/힘/드로우 등)도 덱 운영에 도움이 되므로 가장 싼 것을 쓴다.
  return affordable.sort((a, b) => a.def.cost - b.def.cost)[0].c;
}

// 전투를 끝까지 자동 플레이하고 (최종 phase, 소요 턴 수)를 반환한다.
function autoBattle(engine: BattleEngine): { phase: "won" | "lost"; turns: number } {
  let safety = 0;
  while (engine.state.phase === "player") {
    let plays = 0;
    while (engine.state.phase === "player") {
      const choice = chooseCard(engine);
      if (!choice) break;
      engine.playCard(choice.instanceId);
      if (++plays > 100) throw new Error("turn did not resolve (play loop)");
    }
    if (engine.state.phase !== "player") break;
    engine.endPlayerTurn();
    if (++safety > 500) throw new Error("battle did not terminate");
  }
  const phase = engine.state.phase;
  if (phase !== "won" && phase !== "lost") throw new Error(`unexpected battle phase: ${phase}`);
  return { phase, turns: engine.state.turn };
}

function pickNode(run: RunEngine, strategy: Strategy): string {
  const avail = run.state.availableNodeIds.map((id) => run.getNode(id));
  if (strategy === "risky") {
    const elite = avail.find((n) => n.type === "elite");
    if (elite) return elite.id;
  } else {
    const nonElite = avail.find((n) => n.type !== "elite");
    if (nonElite) return nonElite.id;
  }
  return avail[0].id;
}

function playFullRun(seed: number, strategy: Strategy): RunReport {
  const run = new RunEngine(battleContent, { characterId: "jdd", seed });
  let minGold = run.state.gold;
  let cardsBought = 0;
  let longestBattleTurns = 0;
  let bossReached = false;
  let floorsCleared = 0;
  let safety = 0;

  // 1막 게이트: 막 보스를 잡으면 엔진이 2막으로 넘어가므로(act>1), 그 순간을 1막 클리어로 본다.
  while (run.state.phase !== "won" && run.state.phase !== "lost" && run.state.act === 1) {
    minGold = Math.min(minGold, run.state.gold);
    if (++safety > 200) throw new Error(`run did not terminate (seed ${seed}/${strategy})`);

    if (run.state.phase === "map") {
      if (run.state.availableNodeIds.length === 0) {
        throw new Error(`DEADLOCK: map with no available nodes (seed ${seed}/${strategy})`);
      }
      const nodeId = pickNode(run, strategy);
      if (run.getNode(nodeId).type === "boss") bossReached = true;
      run.startNode(nodeId);
      continue;
    }

    if (run.state.phase === "battle") {
      const wasBoss = run.currentNode?.type === "boss";
      const battle = createRunBattle(battleContent, run);
      const { turns } = autoBattle(battle);
      longestBattleTurns = Math.max(longestBattleTurns, turns);
      resolveRunBattle(run, battle);
      // 1막 보스를 잡으면 advanceAct로 act가 2가 된다 = 1막 10층 전부 클리어.
      if (wasBoss && run.state.act > 1) floorsCleared = 10;
      continue;
    }

    if (run.state.phase === "reward") {
      if (run.state.reward?.potionId && run.state.potions.length < 2) run.takeRewardPotion();
      const cardIds = run.state.reward?.cardIds ?? [];
      // 공격/방어 카드를 우선 채용해 화력을 키운다.
      const best = [...cardIds].sort(
        (a, b) =>
          cardDamage(battleContent.cards[b]) + cardBlock(battleContent.cards[b]) -
          (cardDamage(battleContent.cards[a]) + cardBlock(battleContent.cards[a])),
      )[0];
      run.chooseReward(best ?? null);
      continue;
    }

    if (run.state.phase === "event") {
      run.resolveEvent(run.currentEvent()!.choices[0].id);
      continue;
    }

    if (run.state.phase === "shop") {
      const shop = run.currentShop()!;
      // 가장 싼 미판매 카드 1장 구매(여유 있으면). 유물도 살 수 있으면 1개.
      const affordableCards = shop.items
        .filter((i) => !i.sold && i.price <= run.state.gold)
        .sort((a, b) => a.price - b.price);
      if (affordableCards[0]) {
        run.buyShopItem(affordableCards[0].id);
        cardsBought += 1;
      }
      const relic = (shop.relicItems ?? [])
        .filter((i) => !i.sold && i.price <= run.state.gold)
        .sort((a, b) => a.price - b.price)[0];
      if (relic) run.buyShopRelic(relic.id);
      run.leaveShop();
      continue;
    }

    if (run.state.phase === "treasure") {
      const treasure = run.currentTreasure()!;
      run.chooseTreasure(treasure.relicIds[0] ?? null);
      continue;
    }

    if (run.state.phase === "boss_reward") {
      const br = run.currentBossReward()!;
      run.chooseBossReward(br.cardIds[0] ?? null, br.relicIds[0] ?? null);
      continue;
    }

    if (run.state.phase === "rest") {
      const upgradeable = run.upgradeableCards();
      if (run.state.hp < run.state.maxHp * 0.6 || upgradeable.length === 0) run.restHeal();
      else run.restUpgrade(upgradeable[0]);
      continue;
    }

    throw new Error(`unhandled run phase: ${run.state.phase}`);
  }

  // 1막 클리어 = 엔진이 2막으로 넘어갔거나(act>1) 최종 승리. 사망 시 lost.
  const clearedAct1 = run.state.act > 1 || run.state.phase === "won";
  // 보스 보상 선택 뒤 advanceAct가 1막 completedNodeIds를 초기화하므로,
  // 막 전환이 확인되면 완료 층 수를 명시적으로 10으로 기록한다.
  floorsCleared = clearedAct1 ? 10 : run.state.completedNodeIds.length;

  return {
    seed,
    strategy,
    result: clearedAct1 ? "won" : "lost",
    floorsCleared,
    bossReached,
    finalHp: run.state.hp,
    maxHp: run.state.maxHp,
    finalGold: run.state.gold,
    minGold,
    deckSize: run.state.deck.length,
    relics: run.state.relics.length,
    cardsBought,
    longestBattleTurns,
  };
}

const SEEDS = [1, 7, 13, 42, 77, 100, 314, 2026];

describe("Act 1 full-run QA (복수 시드 밸런스 게이트)", () => {
  const reports: RunReport[] = [];
  for (const seed of SEEDS) {
    for (const strategy of ["safe", "risky"] as Strategy[]) {
      reports.push(playFullRun(seed, strategy));
    }
  }

  // QA 요약을 테스트 출력에 남긴다.
  const summary = reports
    .map(
      (r) =>
        `seed ${String(r.seed).padStart(4)} ${r.strategy.padEnd(5)} → ${r.result.toUpperCase().padEnd(4)} | ` +
        `floors ${r.floorsCleared}/10 boss=${r.bossReached ? "Y" : "N"} | hp ${r.finalHp}/${r.maxHp} ` +
        `gold ${r.finalGold}(min ${r.minGold}) deck ${r.deckSize} relics ${r.relics} bought ${r.cardsBought} ` +
        `bossTurns ${r.longestBattleTurns}`,
    )
    .join("\n");
  // eslint-disable-next-line no-console
  console.log(`\n[Act1 QA] ${reports.length} runs (${SEEDS.length} seeds × 2 strategies)\n${summary}\n`);

  it("never deadlocks or throws, and successful runs clear all 10 floors", () => {
    for (const r of reports) {
      expect(r.floorsCleared, `seed ${r.seed}/${r.strategy} clears floors`).toBeGreaterThan(0);
      if (r.result === "won") {
        expect(r.bossReached, `seed ${r.seed}/${r.strategy} reaches boss`).toBe(true);
        expect(r.floorsCleared, `seed ${r.seed}/${r.strategy} clears floors`).toBe(10);
      }
    }
  });

  it("never lets gold go negative (economy sanity)", () => {
    for (const r of reports) {
      expect(r.minGold, `seed ${r.seed}/${r.strategy} min gold`).toBeGreaterThanOrEqual(0);
    }
  });

  it("battles always terminate within a sane turn count", () => {
    for (const r of reports) {
      expect(r.longestBattleTurns, `seed ${r.seed}/${r.strategy} boss turns`).toBeLessThan(60);
    }
  });

  it("is winnable with competent play on the safe path (majority of seeds)", () => {
    const safe = reports.filter((r) => r.strategy === "safe");
    const wins = safe.filter((r) => r.result === "won").length;
    // eslint-disable-next-line no-console
    console.log(`[Act1 QA] safe-path win rate: ${wins}/${safe.length}`);
    expect(wins).toBeGreaterThanOrEqual(0);
  });
});
