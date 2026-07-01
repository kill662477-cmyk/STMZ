import { Rng } from "./rng";
import type {
  BattleContent,
  BattleModifiers,
  BattleState,
  CardDef,
  CardInstance,
  Effect,
  EnemyActionDef,
  EnemyState,
  IntentView,
  PotionAction,
  StatusKind,
  StatusMap,
} from "./types";

export type BattleEvent =
  | { type: "attack"; by: "player" | "enemy"; enemyIndex?: number }
  | {
      type: "damage";
      target: "player" | "enemy";
      amount: number;
      hits: number;
      hitAmounts: number[];
      enemyIndex?: number;
      source?: "poison";
    }
  | { type: "block"; target: "player" | "enemy"; amount: number; enemyIndex?: number }
  | {
      type: "status";
      target: "player" | "enemy";
      status: StatusKind;
      amount: number;
      enemyIndex?: number;
    }
  | { type: "potion"; effect: "energy" | "draw" | "heal"; amount: number }
  | { type: "defeat"; enemyIndex: number }
  | { type: "win" }
  | { type: "lose" };

export interface BattleOptions {
  characterId: string;
  enemyId?: string;
  enemyIds?: readonly string[];
  seed: number;
  playerHp?: number;
  playerMaxHp?: number;
  deck?: readonly string[];
  mods?: BattleModifiers;
}

const NO_MODS: BattleModifiers = { combatEnergy: 0, combatBlock: 0, combatDraw: 0, combatStrength: 0 };
const PERSISTENT_STATUSES: ReadonlySet<StatusKind> = new Set(["strength"]);

export class BattleEngine {
  readonly state: BattleState;
  private readonly content: BattleContent;
  private readonly rng: Rng;
  private readonly mods: BattleModifiers;
  private readonly defeatedEnemyIndexes = new Set<number>();
  private instanceCounter = 0;

  constructor(content: BattleContent, opts: BattleOptions) {
    this.content = content;
    this.rng = new Rng(opts.seed);
    this.mods = opts.mods ?? NO_MODS;

    const character = content.characters[opts.characterId];
    const enemyIds =
      opts.enemyIds && opts.enemyIds.length > 0
        ? [...opts.enemyIds]
        : opts.enemyId
          ? [opts.enemyId]
          : [];
    const enemyDefs = enemyIds.map((id) => content.enemies[id]);
    if (!character || enemyDefs.length === 0 || enemyDefs.some((enemy) => !enemy)) {
      throw new Error("Unknown character or enemy id.");
    }

    const baseEnergy = character.baseEnergy + this.mods.combatEnergy;
    const maxHp = opts.playerMaxHp ?? character.maxHp;
    const deck = opts.deck ?? character.deck;
    const drawPile = this.rng.shuffle(deck).map((cardId) => this.makeInstance(cardId));
    const enemies: EnemyState[] = enemyDefs.map((enemyDef) => ({
      definitionId: enemyDef.id,
      hp: enemyDef.maxHp,
      maxHp: enemyDef.maxHp,
      block: 0,
      statuses: {},
      actionIndex: 0,
    }));

    this.state = {
      turn: 0,
      phase: "player",
      player: {
        id: character.id,
        name: character.name,
        race: character.race,
        hp: Math.max(1, Math.min(maxHp, opts.playerHp ?? maxHp)),
        maxHp,
        block: 0,
        energy: baseEnergy,
        baseEnergy,
        statuses: {},
        hand: [],
        drawPile,
        discardPile: [],
        exhaustPile: [],
      },
      enemy: enemies[0],
      enemies,
      activeEnemyIndex: 0,
      log: [],
    };

    this.startPlayerTurn();
    if (this.mods.combatBlock > 0) {
      this.state.player.block += this.mods.combatBlock;
      this.log(`유물 방어도 +${this.mods.combatBlock}`);
    }
    if (this.mods.combatStrength > 0) {
      this.state.player.statuses.strength = (this.state.player.statuses.strength ?? 0) + this.mods.combatStrength;
      this.log(`유물 힘 +${this.mods.combatStrength}`);
    }
  }

  private makeInstance(cardId: string): CardInstance {
    this.instanceCounter += 1;
    return { instanceId: `c${this.instanceCounter}`, cardId };
  }

  getCardDef(instance: CardInstance): CardDef {
    const def = this.content.cards[instance.cardId];
    if (!def) throw new Error(`Unknown card: ${instance.cardId}`);
    return def;
  }

  private enemyDef(enemy: EnemyState) {
    return this.content.enemies[enemy.definitionId];
  }

  private currentAction(enemy: EnemyState): EnemyActionDef {
    const def = this.enemyDef(enemy);
    let pattern = def.pattern;
    if (def.phaseTriggerHpRatio !== undefined && def.phase2Pattern) {
      if (enemy.hp / enemy.maxHp <= def.phaseTriggerHpRatio) {
        pattern = def.phase2Pattern;
      }
    }
    const id = pattern[enemy.actionIndex % pattern.length];
    return def.actions[id];
  }

  private syncActiveEnemy(): void {
    const current = this.state.enemies[this.state.activeEnemyIndex];
    if (current?.hp > 0) {
      this.state.enemy = current;
      return;
    }
    const next = this.state.enemies.findIndex((enemy) => enemy.hp > 0);
    if (next >= 0) {
      this.setActiveEnemy(next);
    }
  }

  setActiveEnemy(index: number): void {
    const enemy = this.state.enemies[index];
    if (enemy && enemy.hp > 0) {
      this.state.activeEnemyIndex = index;
      this.state.enemy = enemy;
    }
  }

  getIntent(enemyIndex = this.state.activeEnemyIndex): IntentView {
    const enemy = this.state.enemies[enemyIndex];
    if (!enemy || enemy.hp <= 0) return { intent: "special", name: "격파" };
    const action = this.currentAction(enemy);
    const view: IntentView = { intent: action.intent, name: action.name };
    for (const effect of action.effects) {
      if (effect.kind === "damage") {
        view.damage = this.scaleOutgoing(effect.amount, enemy.statuses);
        view.hits = effect.hits ?? 1;
      } else if (effect.kind === "block") {
        view.block = effect.amount;
      }
    }
    return view;
  }

  private startPlayerTurn(): void {
    const player = this.state.player;
    this.state.turn += 1;
    this.state.phase = "player";
    player.block = 0;
    player.energy = player.baseEnergy;
    this.draw(5 + this.mods.combatDraw);
    this.log(`턴 ${this.state.turn} 시작`);
  }

  private draw(count: number): void {
    const player = this.state.player;
    const MAX_HAND_SIZE = 10;
    
    for (let i = 0; i < count; i++) {
      if (player.drawPile.length === 0) {
        if (player.discardPile.length === 0) break;
        player.drawPile = this.rng.shuffle(player.discardPile);
        player.discardPile = [];
      }
      const card = player.drawPile.shift();
      if (card) {
        if (player.hand.length < MAX_HAND_SIZE) {
          player.hand.push(card);
        } else {
          // Hand is full, discard the drawn card
          player.discardPile.push(card);
        }
      }
    }
  }

  private scaleOutgoing(amount: number, statuses: StatusMap): number {
    let value = amount + (statuses.strength ?? 0);
    if (statuses.weak) value = Math.floor(value * 0.75);
    return Math.max(0, value);
  }

  private dealDamage(
    target: "player" | "enemy",
    rawAmount: number,
    attackerStatuses: StatusMap,
    targetStatuses: StatusMap,
    targetEnemy?: EnemyState,
  ): number {
    let damage = this.scaleOutgoing(rawAmount, attackerStatuses);
    if (targetStatuses.vulnerable) damage = Math.floor(damage * 1.5);
    const unit = target === "player" ? this.state.player : targetEnemy ?? this.state.enemy;
    const absorbed = Math.min(unit.block, damage);
    unit.block -= absorbed;
    const hpLoss = damage - absorbed;
    unit.hp = Math.max(0, unit.hp - hpLoss);
    return hpLoss;
  }

  private applyEffects(
    effects: Effect[],
    source: "player" | "enemy",
    events: BattleEvent[],
    sourceEnemy?: EnemyState,
    sourceEnemyIndex?: number,
  ): void {
    this.syncActiveEnemy();
    const targetEnemy = this.state.enemy;
    const sourceStatuses =
      source === "player" ? this.state.player.statuses : sourceEnemy?.statuses ?? {};
    const foeStatuses =
      source === "player" ? targetEnemy.statuses : this.state.player.statuses;

    for (const effect of effects) {
      if (effect.kind === "damage") {
        const hits = effect.hits ?? 1;
        events.push({ type: "attack", by: source, enemyIndex: source === "enemy" ? sourceEnemyIndex : this.state.activeEnemyIndex });
        const hitAmounts: number[] = [];
        for (let i = 0; i < hits; i++) {
          hitAmounts.push(
            this.dealDamage(
              source === "player" ? "enemy" : "player",
              effect.amount,
              sourceStatuses,
              foeStatuses,
              source === "player" ? targetEnemy : undefined,
            ),
          );
        }
        events.push({
          type: "damage",
          target: source === "player" ? "enemy" : "player",
          amount: hitAmounts.reduce((sum, amount) => sum + amount, 0),
          hits,
          hitAmounts,
          enemyIndex: source === "player" ? this.state.activeEnemyIndex : sourceEnemyIndex,
        });
      } else if (effect.kind === "block") {
        const unit = source === "player" ? this.state.player : sourceEnemy;
        if (!unit) continue;
        unit.block += effect.amount;
        events.push({
          type: "block",
          target: source,
          amount: effect.amount,
          enemyIndex: source === "enemy" ? sourceEnemyIndex : undefined,
        });
      } else if (effect.kind === "applyStatus") {
        const targetSide = effect.target === "self" ? source : source === "player" ? "enemy" : "player";
        const map =
          targetSide === "player"
            ? this.state.player.statuses
            : effect.target === "self" && source === "enemy"
              ? sourceEnemy?.statuses
              : targetEnemy.statuses;
        if (!map) continue;
        map[effect.status] = (map[effect.status] ?? 0) + effect.amount;
        events.push({
          type: "status",
          target: targetSide,
          status: effect.status,
          amount: effect.amount,
          enemyIndex: targetSide === "enemy"
            ? effect.target === "self"
              ? sourceEnemyIndex
              : this.state.activeEnemyIndex
            : undefined,
        });
      } else if (effect.kind === "draw") {
        if (source === "player") this.draw(effect.amount);
      } else if (effect.kind === "energy") {
        if (source === "player") this.state.player.energy += effect.amount;
      }
    }
  }

  private handleEnemyDefeats(events: BattleEvent[]): boolean {
    this.state.enemies.forEach((enemy, index) => {
      if (enemy.hp <= 0 && !this.defeatedEnemyIndexes.has(index)) {
        this.defeatedEnemyIndexes.add(index);
        events.push({ type: "defeat", enemyIndex: index });
      }
    });
    this.syncActiveEnemy();
    if (this.state.enemies.every((enemy) => enemy.hp <= 0)) {
      this.state.phase = "won";
      this.log("전투 승리");
      events.push({ type: "win" });
      return true;
    }
    return false;
  }

  playCard(instanceId: string, targetEnemyIndex?: number): BattleEvent[] {
    const events: BattleEvent[] = [];
    if (this.state.phase !== "player") throw new Error("Not player phase.");
    const player = this.state.player;
    const index = player.hand.findIndex((c) => c.instanceId === instanceId);
    if (index < 0) throw new Error("Card not in hand.");
    const card = player.hand[index];
    const def = this.getCardDef(card);
    if (player.energy < def.cost) throw new Error("Not enough energy.");

    // Update active enemy if target is explicitly provided and valid
    if (targetEnemyIndex !== undefined) {
      this.setActiveEnemy(targetEnemyIndex);
    }

    player.energy -= def.cost;
    player.hand.splice(index, 1);
    if (def.exhaust) player.exhaustPile.push(card);
    else player.discardPile.push(card);
    this.log(`${def.name} 사용`);
    this.applyEffects(def.effects, "player", events);
    this.handleEnemyDefeats(events);
    return events;
  }

  usePotion(action: PotionAction): BattleEvent[] {
    const events: BattleEvent[] = [];
    if (this.state.phase !== "player") return events;
    const player = this.state.player;

    switch (action.kind) {
      case "damage": {
        this.syncActiveEnemy();
        const targetIndex = this.state.activeEnemyIndex;
        const target = this.state.enemy;
        events.push({ type: "attack", by: "player", enemyIndex: targetIndex });
        const dealt = this.dealDamage("enemy", action.amount, {}, target.statuses, target);
        events.push({
          type: "damage",
          target: "enemy",
          amount: dealt,
          hits: 1,
          hitAmounts: [dealt],
          enemyIndex: targetIndex,
        });
        break;
      }
      case "block":
        player.block += action.amount;
        events.push({ type: "block", target: "player", amount: action.amount });
        break;
      case "energy":
        player.energy += action.amount;
        events.push({ type: "potion", effect: "energy", amount: action.amount });
        break;
      case "draw": {
        const handBefore = player.hand.length;
        this.draw(action.amount);
        events.push({ type: "potion", effect: "draw", amount: player.hand.length - handBefore });
        break;
      }
      case "heal": {
        const hpBefore = player.hp;
        player.hp = Math.min(player.maxHp, player.hp + action.amount);
        events.push({ type: "potion", effect: "heal", amount: player.hp - hpBefore });
        break;
      }
    }
    this.log("포션 사용");
    this.handleEnemyDefeats(events);
    return events;
  }

  endPlayerTurn(): BattleEvent[] {
    const events: BattleEvent[] = [];
    if (this.state.phase !== "player") return events;

    this.state.player.discardPile.push(...this.state.player.hand);
    this.state.player.hand = [];
    this.applyRegen("player", events);
    this.tickStatuses(this.state.player.statuses);

    this.state.phase = "enemy";
    for (const enemy of this.state.enemies) {
      if (enemy.hp > 0) enemy.block = 0;
    }

    for (let enemyIndex = 0; enemyIndex < this.state.enemies.length; enemyIndex++) {
      const enemy = this.state.enemies[enemyIndex];
      if (enemy.hp <= 0) continue;

      this.applyPoison("enemy", events, enemyIndex);
      if (enemy.hp <= 0) {
        if (this.handleEnemyDefeats(events)) return events;
        continue;
      }

      const stunned = (enemy.statuses.stun ?? 0) > 0;
      if (stunned) {
        this.log(`${this.enemyDef(enemy).name} 기절 — 행동 불가`);
      } else {
        const action = this.currentAction(enemy);
        this.log(`${this.enemyDef(enemy).name}: ${action.name}`);
        this.applyEffects(action.effects, "enemy", events, enemy, enemyIndex);
      }

      this.applyRegen("enemy", events, enemyIndex);
      this.tickStatuses(enemy.statuses);
      enemy.actionIndex += 1;

      if (this.state.player.hp <= 0) {
        this.state.phase = "lost";
        this.log("전투 패배");
        events.push({ type: "lose" });
        return events;
      }
    }

    this.startPlayerTurn();
    this.applyPoison("player", events);
    if (this.state.player.hp <= 0) {
      this.state.phase = "lost";
      this.log("전투 패배");
      events.push({ type: "lose" });
    }
    return events;
  }

  private applyPoison(
    target: "player" | "enemy",
    events: BattleEvent[],
    enemyIndex = this.state.activeEnemyIndex,
  ): void {
    const unit = target === "player" ? this.state.player : this.state.enemies[enemyIndex];
    if (!unit) return;
    const poison = unit.statuses.poison ?? 0;
    if (poison > 0) {
      unit.hp = Math.max(0, unit.hp - poison);
      events.push({
        type: "damage",
        target,
        amount: poison,
        hits: 1,
        hitAmounts: [poison],
        enemyIndex: target === "enemy" ? enemyIndex : undefined,
        source: "poison",
      });
      this.log(`${target === "player" ? "" : `${this.enemyDef(unit as EnemyState).name} `}중독 ${poison}`);
    }
  }

  private applyRegen(
    target: "player" | "enemy",
    events: BattleEvent[],
    enemyIndex = this.state.activeEnemyIndex,
  ): void {
    const unit = target === "player" ? this.state.player : this.state.enemies[enemyIndex];
    if (!unit) return;
    const regen = unit.statuses.regen ?? 0;
    if (regen > 0) {
      const before = unit.hp;
      unit.hp = Math.min(unit.maxHp, unit.hp + regen);
      const healed = unit.hp - before;
      if (healed > 0) {
        events.push({ type: "potion", effect: "heal", amount: healed });
        this.log(`${target === "player" ? "" : `${this.enemyDef(unit as EnemyState).name} `}재생 ${healed}`);
      }
    }
  }

  private tickStatuses(statuses: StatusMap): void {
    for (const key of Object.keys(statuses) as StatusKind[]) {
      if (PERSISTENT_STATUSES.has(key)) continue;
      const value = (statuses[key] ?? 0) - 1;
      if (value <= 0) delete statuses[key];
      else statuses[key] = value;
    }
  }

  private log(message: string): void {
    this.state.log.push(message);
    if (this.state.log.length > 30) this.state.log.shift();
  }
}
