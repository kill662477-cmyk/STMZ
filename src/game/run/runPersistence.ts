import type { BattleContent } from "../engine/types";
import { RunEngine } from "./RunEngine";
import type { RunPhase, RunState } from "./types";
import { supabase, getOrCreateUserId } from "./supabaseClient";

export const RUN_SAVE_KEY = "slay-the-monstarz.run";
export const META_SAVE_KEY = "slay-the-monstarz.meta";
export const RUN_SAVE_VERSION = 2;

export interface RunStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface RunSaveEnvelope {
  saveVersion: 1 | 2;
  savedAt: string;
  state: RunState;
}

export interface LoadedRun {
  run: RunEngine;
  savedAt: string;
}

const RUN_PHASES: ReadonlySet<RunPhase> = new Set([
  "map",
  "battle",
  "reward",
  "boss_reward",
  "rest",
  "event",
  "shop",
  "treasure",
  "won",
  "lost",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNullableRecord(value: unknown): value is Record<string, unknown> | null {
  return value === null || isRecord(value);
}

function isRunState(value: unknown): value is RunState {
  if (!isRecord(value)) return false;
  if (value.version !== RUN_SAVE_VERSION || (value.act !== 1 && value.act !== 2 && value.act !== 3)) return false;
  if (!isFiniteNumber(value.ascension)) return false;
  if (!isFiniteNumber(value.seed) || !Number.isInteger(value.seed)) return false;
  if (typeof value.phase !== "string" || !RUN_PHASES.has(value.phase as RunPhase)) return false;
  if (typeof value.characterId !== "string") return false;
  if (!isFiniteNumber(value.hp) || !isFiniteNumber(value.maxHp) || !isFiniteNumber(value.gold)) {
    return false;
  }
  if (value.hp < 0 || value.maxHp <= 0 || value.hp > value.maxHp || value.gold < 0) return false;
  if (!isStringArray(value.deck) || !isStringArray(value.relics)) return false;
  if (!isStringArray(value.potions)) return false;
  if (value.currentNodeId !== null && typeof value.currentNodeId !== "string") return false;
  if (!isStringArray(value.completedNodeIds) || !isStringArray(value.availableNodeIds)) return false;
  const reward = value.reward;
  const event = value.event;
  const shop = value.shop;
  const treasure = value.treasure;
  const bossReward = value.bossReward;
  if (!isNullableRecord(reward)) return false;
  if (!isNullableRecord(event)) return false;
  if (!isNullableRecord(shop)) return false;
  if (!isNullableRecord(treasure)) return false;
  if (!isNullableRecord(bossReward)) return false;

  if (reward !== null) {
    if (
      typeof reward.sourceNodeId !== "string" ||
      !isStringArray(reward.cardIds) ||
      !isFiniteNumber(reward.gold) ||
      reward.gold < 0 ||
      (reward.relicId !== undefined && typeof reward.relicId !== "string") ||
      (reward.potionId !== undefined && typeof reward.potionId !== "string")
    ) {
      return false;
    }
  }

  if (event !== null) {
    if (
      typeof event.sourceNodeId !== "string" ||
      typeof event.eventId !== "string"
    ) {
      return false;
    }
  }

  if (shop !== null) {
    if (
      typeof shop.sourceNodeId !== "string" ||
      !Array.isArray(shop.items) ||
      !isFiniteNumber(shop.removalPrice) ||
      shop.removalPrice < 0 ||
      typeof shop.removalUsed !== "boolean"
    ) {
      return false;
    }
    for (const item of shop.items) {
      if (
        !isRecord(item) ||
        typeof item.id !== "string" ||
        typeof item.cardId !== "string" ||
        !isFiniteNumber(item.price) ||
        item.price < 0 ||
        typeof item.sold !== "boolean"
      ) {
        return false;
      }
    }
    if (shop.relicItems !== undefined) {
      if (!Array.isArray(shop.relicItems)) return false;
      for (const item of shop.relicItems) {
        if (
          !isRecord(item) ||
          typeof item.id !== "string" ||
          typeof item.relicId !== "string" ||
          !isFiniteNumber(item.price) ||
          item.price < 0 ||
          typeof item.sold !== "boolean"
        ) {
          return false;
        }
      }
    }
    if (shop.potionItems !== undefined) {
      if (!Array.isArray(shop.potionItems)) return false;
      for (const item of shop.potionItems) {
        if (
          !isRecord(item) ||
          typeof item.id !== "string" ||
          typeof item.potionId !== "string" ||
          !isFiniteNumber(item.price) ||
          item.price < 0 ||
          typeof item.sold !== "boolean"
        ) {
          return false;
        }
      }
    }
  }

  if (treasure !== null) {
    if (
      typeof treasure.sourceNodeId !== "string" ||
      !isStringArray(treasure.relicIds)
    ) {
      return false;
    }
  }

  if (bossReward !== null) {
    if (!isStringArray(bossReward.cardIds) || !isStringArray(bossReward.relicIds)) {
      return false;
    }
  }

  
return true;
}

function migrateSignatureCard(state: RunState, content: BattleContent): RunState {
  const character = content.characters[state.characterId];
  const signatureCard = character?.signatureCard;
  if (!signatureCard || !content.cards[signatureCard]) return state;
  if (state.deck.some((cardId) => cardId === signatureCard || cardId === `${signatureCard}+`)) {
    return state;
  }

  const deck = [...state.deck];
  const baseStrikeIndex = deck.indexOf("strike");
  if (baseStrikeIndex !== -1) {
    deck[baseStrikeIndex] = signatureCard;
    return { ...state, deck };
  }

  const upgradedStrikeIndex = deck.indexOf("strike+");
  if (upgradedStrikeIndex !== -1 && content.cards[`${signatureCard}+`]) {
    deck[upgradedStrikeIndex] = `${signatureCard}+`;
    return { ...state, deck };
  }

  // 모든 기본 타격을 이미 제거한 오래된 런도 고유 카드를 잃지 않도록 한 장 추가한다.
  deck.push(signatureCard);
  return { ...state, deck };
}

/** Writes the current between-node state as a versioned JSON snapshot. */
export function saveRun(storage: RunStorage, state: RunState, now = new Date()): void {
  const envelope: RunSaveEnvelope = {
    saveVersion: RUN_SAVE_VERSION,
    savedAt: now.toISOString(),
    state,
  };
  storage.setItem(RUN_SAVE_KEY, JSON.stringify(envelope));

  if (supabase) {
    const userId = getOrCreateUserId();
    supabase
      .from("run_saves")
      .upsert({
        user_id: userId,
        state: state,
        updated_at: now.toISOString(),
      })
      .then(({ error }) => {
        if (error) console.error("Supabase run save error:", error);
      });
  }
}

/** Loads a compatible run, removing invalid data when the storage allows it. */
export function loadRun(storage: RunStorage, content: BattleContent): LoadedRun | null {
  let json: string | null;
  try {
    json = storage.getItem(RUN_SAVE_KEY);
  } catch {
    return null;
  }
  if (!json) return null;

  try {
    const value: any = JSON.parse(json);
    if (!isRecord(value)) throw new Error("Invalid run save envelope.");
    if (value.saveVersion !== 1 && value.saveVersion !== 2) {
      throw new Error("Unsupported run save envelope.");
    }
    if (typeof value.savedAt !== "string") {
      throw new Error("Missing savedAt.");
    }

    if (value.saveVersion === 1) {
      value.saveVersion = 2;
      const state = value.state as any;
      if (state) {
        state.version = 2;
        state.ascension = 1;
      }
    }

    if (!isRunState(value.state)) {
      throw new Error("Invalid run save state.");
    }

    const migratedState = migrateSignatureCard(value.state, content);
    return {
      run: RunEngine.restore(content, migratedState),
      savedAt: value.savedAt,
    };
  } catch {
    try {
      storage.removeItem(RUN_SAVE_KEY);
    } catch {
      // 읽기 실패/타입 오류 시 안전하게 무시한다.
    }
    return null;
  }
}

export interface MetaState {
  version: 1;
  unlockedAscension: Record<string, number>;
}

export function loadMeta(storage: RunStorage): MetaState {
  const defaultMeta: MetaState = { version: 1, unlockedAscension: {} };
  try {
    const json = storage.getItem(META_SAVE_KEY);
    if (!json) return defaultMeta;
    const data = JSON.parse(json);
    if (data.version === 1 && typeof data.unlockedAscension === "object" && data.unlockedAscension !== null) {
      return data;
    }
  } catch {
    // Ignore error
  }
  return defaultMeta;
}

export function saveMeta(storage: RunStorage, state: MetaState): void {
  storage.setItem(META_SAVE_KEY, JSON.stringify(state));

  if (supabase) {
    const userId = getOrCreateUserId();
    supabase
      .from("meta_saves")
      .upsert({
        user_id: userId,
        state: state,
        updated_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) console.error("Supabase meta save error:", error);
      });
  }
}

export function unlockNextAscension(storage: RunStorage, currentAscension: number, race: string = "global"): void {
  const meta = loadMeta(storage);
  const currentUnlocked = meta.unlockedAscension[race] ?? meta.unlockedAscension["global"] ?? 1;
  if (currentAscension >= currentUnlocked && currentAscension < 5) {
    meta.unlockedAscension[race] = currentAscension + 1;
    saveMeta(storage, meta);
  }
}

export function getUnlockedAscension(storage: RunStorage, race: string = "global"): number {
  const meta = loadMeta(storage);
  return meta.unlockedAscension[race] ?? meta.unlockedAscension["global"] ?? 1;
}

/** Removes the active run slot. */
export function clearRunSave(storage: RunStorage): void {
  storage.removeItem(RUN_SAVE_KEY);

  if (supabase) {
    const userId = getOrCreateUserId();
    supabase
      .from("run_saves")
      .delete()
      .eq("user_id", userId)
      .then(({ error }) => {
        if (error) console.error("Supabase run clear error:", error);
      });
  }
}

export async function syncCloudData(
  storage: RunStorage,
  content: BattleContent
): Promise<{ run: RunEngine | null; meta: MetaState | null } | null> {
  if (!supabase) return null;
  const userId = getOrCreateUserId();

  let cloudRun: RunState | null = null;
  let cloudRunUpdatedAt: string | null = null;
  let cloudMeta: MetaState | null = null;
  let cloudMetaUpdatedAt: string | null = null;

  try {
    const [runRes, metaRes] = await Promise.all([
      supabase.from("run_saves").select("state, updated_at").eq("user_id", userId).maybeSingle(),
      supabase.from("meta_saves").select("state, updated_at").eq("user_id", userId).maybeSingle(),
    ]);

    if (runRes.data) {
      cloudRun = runRes.data.state as RunState;
      cloudRunUpdatedAt = runRes.data.updated_at;
    }
    if (metaRes.data) {
      cloudMeta = metaRes.data.state as MetaState;
      cloudMetaUpdatedAt = metaRes.data.updated_at;
    }
  } catch (e) {
    console.error("Failed to fetch cloud saves", e);
    return null;
  }

  let resolvedRun: RunEngine | null = null;
  let resolvedMeta: MetaState | null = null;

  // Resolve Run Save
  if (cloudRun && cloudRunUpdatedAt) {
    const localRaw = storage.getItem(RUN_SAVE_KEY);
    let useCloud = false;
    if (!localRaw) {
      useCloud = true;
    } else {
      try {
        const localEnvelope = JSON.parse(localRaw);
        if (new Date(cloudRunUpdatedAt) > new Date(localEnvelope.savedAt)) {
          useCloud = true;
        }
      } catch {
        useCloud = true;
      }
    }

    if (useCloud) {
      const envelope = {
        saveVersion: RUN_SAVE_VERSION,
        savedAt: cloudRunUpdatedAt,
        state: cloudRun,
      };
      storage.setItem(RUN_SAVE_KEY, JSON.stringify(envelope));
      resolvedRun = RunEngine.restore(content, cloudRun);
    }
  } else {
    // Sync local to cloud
    const localRaw = storage.getItem(RUN_SAVE_KEY);
    if (localRaw) {
      try {
        const localEnvelope = JSON.parse(localRaw);
        await supabase.from("run_saves").upsert({
          user_id: userId,
          state: localEnvelope.state,
          updated_at: localEnvelope.savedAt,
        });
      } catch {}
    }
  }

  // Resolve Meta Progression
  if (cloudMeta && cloudMetaUpdatedAt) {
    const localRaw = storage.getItem(META_SAVE_KEY);
    let useCloud = false;
    if (!localRaw) {
      useCloud = true;
    } else {
      try {
        const localMeta = JSON.parse(localRaw) as MetaState;
        const getMetaSum = (meta: MetaState) =>
          Object.values(meta.unlockedAscension || {}).reduce((sum, val) => sum + val, 0);
        if (getMetaSum(cloudMeta) > getMetaSum(localMeta)) {
          useCloud = true;
        }
      } catch {
        useCloud = true;
      }
    }

    if (useCloud) {
      storage.setItem(META_SAVE_KEY, JSON.stringify(cloudMeta));
      resolvedMeta = cloudMeta;
    }
  } else {
    // Sync local to cloud
    const localRaw = storage.getItem(META_SAVE_KEY);
    if (localRaw) {
      try {
        const localMeta = JSON.parse(localRaw);
        await supabase.from("meta_saves").upsert({
          user_id: userId,
          state: localMeta,
          updated_at: new Date().toISOString(),
        });
      } catch {}
    }
  }

  return { run: resolvedRun, meta: resolvedMeta };
}
