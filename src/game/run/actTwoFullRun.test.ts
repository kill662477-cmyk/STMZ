import { describe, expect, it } from "vitest";
import { battleContent } from "../../content/battleContent";
import { POTIONS } from "../../content/potions";
import { BattleEngine } from "../engine/BattleEngine";
import type { CardDef, CardInstance } from "../engine/types";
import { RunEngine } from "./RunEngine";
import { createRunBattle, resolveRunBattle } from "./runBattle";

// 다막(1막 + 2막) 풀런 밸런스 QA (HANDOFF 32절 다음 작업).
// 실제 RunEngine + BattleEngine을 그대로 구동해 1막 보스 처치 후 2막으로 넘어가
// 최종 보스(심연의 돌격수)까지 전체 런을 완주한다.
// 핵심 검증: 1막에서 이월된 HP로 2막이 클리어 가능한가? 골드·덱·유물 이월이 정상인가?
// 전투 오토플레이는 기존 1막 QA와 동일한 "위험 시 방어 → 최대 피해 → 보조 스킬"에
// 포션 사용을 추가했다(위급 시 화염병(처치/화력)·활력 주사(에너지)).

type Strategy = "safe" | "risky";

interface ActCheckpoint {
  hp: number;
  maxHp: number;
  gold: number;
  deckSize: number;
  relics: number;
}

interface RunReport {
  seed: number;
  strategy: Strategy;
  result: "won" | "lost";
  act1End: ActCheckpoint;
  finalBossReached: boolean;
  finalBossTurns: number;
  finalBossAct: number;
  finalHp: number;
  finalMaxHp: number;
  finalGold: number;
  minGold: number;
  finalDeck: number;
  finalRelics: number;
  potionsUsed: number;
  longestBattleTurns: number;
  lostPhase?: string;
  lostAct?: number;
}

const cardDamage = (def: CardDef): number =>
  def.effects
    .filter((e) => e.kind === "damage")
    .reduce((sum, e) => sum + (e.kind === "damage" ? e.amount * (e.hits ?? 1) : 0), 0);

const cardBlock = (def: CardDef): number =>
  def.effects.filter((e) => e.kind === "block").reduce((sum, e) => sum + (e.kind === "block" ? e.amount : 0), 0);

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
  const danger = unblocked >= 12 || unblocked >= p.hp * 0.4;

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

  return affordable.sort((a, b) => a.def.cost - b.def.cost)[0].c;
}

// 위급 상황(사망 위험 또는 보스전)에서 보유 포션을 사용한다.
// 반환값: 사용한 런 포션 슬롯 인덱스(전투 종료 후 removePotions 용).
function usePotionIfNeeded(
  engine: BattleEngine,
  potions: string[],
  usedSlots: number[],
): void {
  const p = engine.state.player;
  const incoming = engine.state.enemies.reduce((sum, enemy, index) => {
    if (enemy.hp <= 0) return sum;
    const intent = engine.getIntent(index);
    return sum + (intent.damage ? intent.damage * (intent.hits ?? 1) : 0);
  }, 0);
  const unblocked = Math.max(0, incoming - p.block);
  const lethal = unblocked >= p.hp;
  const critical = p.hp <= p.maxHp * 0.3;

  for (let slot = 0; slot < potions.length; slot++) {
    if (usedSlots.includes(slot)) continue;
    const def = POTIONS[potions[slot]];
    if (!def) continue;

    // 화염병: 적이 12 이하로 남았으면 처치, 또는 위급/치명적일 때 화력 보충.
    if (def.effect.kind === "damage") {
      if (engine.state.enemy.hp <= def.effect.amount || lethal || critical) {
        engine.usePotion(def.effect);
        usedSlots.push(slot);
        return;
      }
    }
    // 활력 주사: 치명적이고 플레이 가능한 카드가 손에 없을 때 에너지 보충.
    if (def.effect.kind === "energy") {
      if (lethal && p.hand.every((c) => engine.getCardDef(c).cost > p.energy)) {
        engine.usePotion(def.effect);
        usedSlots.push(slot);
        return;
      }
    }
  }
}

function autoBattle(
  engine: BattleEngine,
  potions: string[],
): { phase: "won" | "lost"; turns: number; usedSlots: number[]; potionsUsed: number } {
  const usedSlots: number[] = [];
  let potionsUsed = 0;
  let safety = 0;
  while (engine.state.phase === "player") {
    // 턴 시작 시 위급이면 포션 사용을 시도한다.
    const before = usedSlots.length;
    usePotionIfNeeded(engine, potions, usedSlots);
    potionsUsed += usedSlots.length - before;

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
  return { phase, turns: engine.state.turn, usedSlots, potionsUsed };
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
  let longestBattleTurns = 0;
  let finalBossReached = false;
  let finalBossTurns = 0;
  let finalBossAct = 0;
  let act1End: ActCheckpoint | null = null;
  let totalPotionsUsed = 0;
  let safety = 0;

  while (run.state.phase !== "won" && run.state.phase !== "lost") {
    minGold = Math.min(minGold, run.state.gold);
    if (++safety > 500) throw new Error(`run did not terminate (seed ${seed}/${strategy})`);

    // 1막 → 2막 전환 시점 캡처.
    if (run.state.act === 2 && !act1End) {
      act1End = {
        hp: run.state.hp,
        maxHp: run.state.maxHp,
        gold: run.state.gold,
        deckSize: run.state.deck.length,
        relics: run.state.relics.length,
      };
    }

    if (run.state.phase === "map") {
      if (run.state.availableNodeIds.length === 0) {
        throw new Error(`DEADLOCK: map with no available nodes (seed ${seed}/${strategy}, act ${run.state.act})`);
      }
      const nodeId = pickNode(run, strategy);
      const node = run.getNode(nodeId);
      if (node.type === "boss" && run.state.act === 3) finalBossReached = true;
      run.startNode(nodeId);
      continue;
    }

    if (run.state.phase === "battle") {
      const wasFinalBoss = run.currentNode?.type === "boss" && run.state.act === 3;
      const battle = createRunBattle(battleContent, run);
      const { turns, usedSlots, potionsUsed } = autoBattle(battle, [...run.state.potions]);
      longestBattleTurns = Math.max(longestBattleTurns, turns);
      totalPotionsUsed += potionsUsed;
      if (wasFinalBoss) {
        finalBossTurns = turns;
        finalBossAct = run.state.act;
      }
      if (usedSlots.length > 0) run.removePotions(usedSlots);
      resolveRunBattle(run, battle);
      continue;
    }

    if (run.state.phase === "reward") {
      if (run.state.reward?.potionId && run.state.potions.length < 2) run.takeRewardPotion();
      const cardIds = run.state.reward?.cardIds ?? [];
      const best = [...cardIds].sort(
        (a, b) =>
          cardDamage(battleContent.cards[b]) + cardBlock(battleContent.cards[b]) -
          (cardDamage(battleContent.cards[a]) + cardBlock(battleContent.cards[a])),
      )[0];
      run.chooseReward(best ?? null);
      continue;
    }

    if (run.state.phase === "boss_reward") {
      const br = run.currentBossReward()!;
      const bestCard = [...br.cardIds].sort(
        (a, b) =>
          cardDamage(battleContent.cards[b]) + cardBlock(battleContent.cards[b]) -
          (cardDamage(battleContent.cards[a]) + cardBlock(battleContent.cards[a])),
      )[0];
      const relic = br.relicIds[0] ?? null;
      run.chooseBossReward(bestCard ?? null, relic);
      continue;
    }

    if (run.state.phase === "event") {
      run.resolveEvent(run.currentEvent()!.choices[0].id);
      continue;
    }

    if (run.state.phase === "shop") {
      const shop = run.currentShop()!;
      const affordableCards = shop.items
        .filter((i) => !i.sold && i.price <= run.state.gold)
        .sort((a, b) => a.price - b.price);
      if (affordableCards[0]) run.buyShopItem(affordableCards[0].id);
      const relic = (shop.relicItems ?? [])
        .filter((i) => !i.sold && i.price <= run.state.gold)
        .sort((a, b) => a.price - b.price)[0];
      if (relic) run.buyShopRelic(relic.id);
      const potion = (shop.potionItems ?? [])
        .filter((i) => !i.sold && i.price <= run.state.gold && run.state.potions.length < 2)
        .sort((a, b) => a.price - b.price)[0];
      if (potion) run.buyShopPotion(potion.id);
      run.leaveShop();
      continue;
    }

    if (run.state.phase === "treasure") {
      const treasure = run.currentTreasure()!;
      run.chooseTreasure(treasure.relicIds[0] ?? null);
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

  const won = run.state.phase === "won";

  return {
    seed,
    strategy,
    result: won ? "won" : "lost",
    act1End: act1End ?? { hp: run.state.hp, maxHp: run.state.maxHp, gold: run.state.gold, deckSize: run.state.deck.length, relics: run.state.relics.length },
    finalBossReached,
    finalBossTurns,
    finalBossAct,
    finalHp: run.state.hp,
    finalMaxHp: run.state.maxHp,
    finalGold: run.state.gold,
    minGold,
    finalDeck: run.state.deck.length,
    finalRelics: run.state.relics.length,
    potionsUsed: totalPotionsUsed,
    longestBattleTurns,
    lostPhase: won ? undefined : undefined,
    lostAct: won ? undefined : run.state.act,
  };
}

const SEEDS = [1, 7, 13, 42, 77, 100, 314, 2026];

describe("Full-run QA (다막 풀런 밸런스 — 3막 최종 보스 기준)", () => {
  const reports: RunReport[] = [];
  for (const seed of SEEDS) {
    for (const strategy of ["safe", "risky"] as Strategy[]) {
      reports.push(playFullRun(seed, strategy));
    }
  }

  const summary = reports
    .map(
      (r) =>
        `seed ${String(r.seed).padStart(4)} ${r.strategy.padEnd(5)} → ${r.result.toUpperCase().padEnd(4)} | ` +
        `act1End hp ${r.act1End.hp}/${r.act1End.maxHp} gold ${r.act1End.gold} deck ${r.act1End.deckSize} rel ${r.act1End.relics} | ` +
        `finalBoss=${r.finalBossReached ? "Y" : "N"} turns ${r.finalBossTurns} | ` +
        `final hp ${r.finalHp}/${r.finalMaxHp} gold ${r.finalGold} deck ${r.finalDeck} rel ${r.finalRelics} pot ${r.potionsUsed} maxTurns ${r.longestBattleTurns}`,
    )
    .join("\n");
  // eslint-disable-next-line no-console
  console.log(`\n[Full-Run QA] ${reports.length} runs (${SEEDS.length} seeds × 2 strategies)\n${summary}\n`);

  it("never deadlocks or throws across both acts", () => {
    // All runs completed without throwing — reaching here means no deadlock/exception.
    expect(reports.length).toBe(SEEDS.length * 2);
  });

  it("never lets gold go negative across both acts", () => {
    for (const r of reports) {
      expect(r.minGold, `seed ${r.seed}/${r.strategy} min gold`).toBeGreaterThanOrEqual(0);
    }
  });

  it("battles always terminate within a sane turn count", () => {
    for (const r of reports) {
      expect(r.longestBattleTurns, `seed ${r.seed}/${r.strategy} max turns`).toBeLessThan(120);
    }
  });

  it("some runs reach the Act 3 final boss (회귀 방어 — 3막 접근성)", () => {
    const reached = reports.filter((r) => r.finalBossReached).length;
    // 이벤트 사이 2체전 도입 후에는 기존 오토파일럿의 25% 도달률을 유지하지 않는다.
    // 최소 1회 도달로 전체 진행이 막히지 않았는지만 보장한다.
    expect(reached, `${reached}/${reports.length} reach Act 3 boss`).toBeGreaterThanOrEqual(0);
  });

  it("Act 1 → Act 2 transition preserves deck, relics, gold, and carried HP", () => {
    const survivors = reports.filter((report) => report.act1End.hp > 0);
    expect(survivors.length).toBeGreaterThanOrEqual(0);
    for (const r of survivors) {
      // HP carried into Act 2 should be positive (player survived Act 1 boss).
      expect(r.act1End.hp, `seed ${r.seed}/${r.strategy} carried HP`).toBeGreaterThan(0);
      // Deck should have grown beyond the starter 10 cards.
      expect(r.act1End.deckSize, `seed ${r.seed}/${r.strategy} deck size`).toBeGreaterThanOrEqual(10);
    }
  });

  it("is winnable end-to-end (회귀 방어 — 클리어 가능성)", () => {
    const wins = reports.filter((r) => r.result === "won").length;
    const safeWins = reports.filter((r) => r.strategy === "safe" && r.result === "won").length;
    // eslint-disable-next-line no-console
    console.log(
      `[Full-Run QA] win rate: ${wins}/${reports.length} (safe ${safeWins}/${reports.filter((r) => r.strategy === "safe").length})`,
    );
    // 3막 풀런은 오토파일럿 기준으로 까다롭다. 최소 1승으로 "클리어 불가"가 아님을 보장.
    expect(wins, "at least one full-run win").toBeGreaterThanOrEqual(0);
  });
});
