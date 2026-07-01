import { describe, expect, it } from "vitest";
import { battleContent } from "./battleContent";
import { T_CARD_POOL, P_CARD_POOL, Z_CARD_POOL } from "./cardPools";

const baseCardIds = Object.keys(battleContent.cards).filter((id) => !id.endsWith("+"));

describe("battleContent cards", () => {
  it("defines at least 12 base cards across all race pools", () => {
    expect(baseCardIds.length).toBeGreaterThanOrEqual(12);
  });

  it("generates an upgraded + variant for every base card", () => {
    for (const id of baseCardIds) {
      const base = battleContent.cards[id];
      const upgraded = battleContent.cards[`${id}+`];
      expect(upgraded).toBeTruthy();
      expect(upgraded.effects).toHaveLength(base.effects.length);
      if (id === "flash_bang") {
        expect(upgraded.cost).toBe(1);
      } else {
        expect(upgraded.cost).toBe(base.cost);
      }
    }
  });

  it("raises numeric effect amounts on the upgraded variant", () => {
    for (const id of baseCardIds) {
      const base = battleContent.cards[id];
      const upgraded = battleContent.cards[`${id}+`];
      base.effects.forEach((effect, index) => {
        const up = upgraded.effects[index];
        expect(up.kind).toBe(effect.kind);
        if ("amount" in effect && "amount" in up) {
          if (id === "flash_bang" && "status" in effect && effect.status === "stun") {
            expect(up.amount).toBe(effect.amount);
          } else if ((id === "mind_spike" || id === "overcharge") && effect.kind === "draw") {
            expect(up.amount).toBe(effect.amount);
          } else {
            expect(up.amount).toBeGreaterThan(effect.amount);
          }
        }
      });
    }
  });

  it("includes the T draft cards in the T pool", () => {
    for (const id of ["bash", "flurry", "aimedshot", "shieldwall", "pin", "adrenaline", "empower"]) {
      expect(battleContent.cards[id]).toBeTruthy();
      expect(T_CARD_POOL).toContain(id);
    }
  });

  it("carries the exhaust flag onto the upgraded variant and notes it", () => {
    expect(battleContent.cards.adrenaline.exhaust).toBe(true);
    expect(battleContent.cards["adrenaline+"].exhaust).toBe(true);
    expect(battleContent.cards["adrenaline+"].description).toContain("소멸");

    expect(battleContent.cards.adaptive_regrowth.exhaust).toBe(true);
    expect(battleContent.cards["adaptive_regrowth+"].exhaust).toBe(true);
    expect(battleContent.cards["adaptive_regrowth+"].description).toContain("소멸");

    expect(battleContent.cards.flash_bang.exhaust).toBe(true);
    expect(battleContent.cards["flash_bang+"].exhaust).toBe(true);
    expect(battleContent.cards["flash_bang+"].description).toContain("소멸");
  });

  it("assigns a shop rarity to every card and preserves it on upgrades", () => {
    const valid = new Set(["common", "uncommon", "rare"]);
    for (const id of baseCardIds) {
      const base = battleContent.cards[id];
      expect(valid.has(base.rarity)).toBe(true);
      expect(battleContent.cards[`${id}+`].rarity).toBe(base.rarity);
    }
    expect(baseCardIds.some((id) => battleContent.cards[id].rarity === "uncommon")).toBe(true);
    expect(baseCardIds.some((id) => battleContent.cards[id].rarity === "rare")).toBe(true);
  });
});

describe("race card pools", () => {
  it("each race pool references existing, non-upgraded cards", () => {
    for (const [name, pool] of [["T", T_CARD_POOL], ["P", P_CARD_POOL], ["Z", Z_CARD_POOL]] as const) {
      expect(pool.length, `${name} pool size`).toBeGreaterThanOrEqual(8);
      for (const id of pool) {
        expect(battleContent.cards[id], `${name} pool card ${id}`).toBeTruthy();
        expect(id.endsWith("+"), `${name} pool has no upgrades`).toBe(false);
      }
    }
  });

  it("keeps starter basics (strike/guard) out of all race pools", () => {
    for (const pool of [T_CARD_POOL, P_CARD_POOL, Z_CARD_POOL]) {
      expect(pool).not.toContain("strike");
      expect(pool).not.toContain("guard");
    }
  });

  it("keeps character signature cards out of every shared draft pool", () => {
    const sharedCards = new Set([...T_CARD_POOL, ...P_CARD_POOL, ...Z_CARD_POOL]);
    for (const character of Object.values(battleContent.characters)) {
      expect(sharedCards.has(character.signatureCard)).toBe(false);
    }
  });
});

describe("character signature cards", () => {
  it("keeps the active roster at 20 characters without retired entries", () => {
    const characters = Object.values(battleContent.characters);
    expect(characters).toHaveLength(20);
    expect(characters.filter((character) => character.race === "T")).toHaveLength(6);
    expect(characters.filter((character) => character.race === "P")).toHaveLength(5);
    expect(characters.filter((character) => character.race === "Z")).toHaveLength(9);
    expect(battleContent.characters.pado).toBeUndefined();
    expect(battleContent.characters.peanut).toBeUndefined();
    expect(battleContent.cards.pado_signature).toBeUndefined();
    expect(battleContent.cards.peanut_signature).toBeUndefined();
  });

  it("gives every character one unique signature card in a ten-card starter deck", () => {
    const assigned = new Set<string>();
    for (const character of Object.values(battleContent.characters)) {
      const signature = battleContent.cards[character.signatureCard];
      expect(signature, `${character.id} signature exists`).toBeTruthy();
      expect(signature.signatureFor).toBe(character.id);
      expect(character.deck).toHaveLength(10);
      expect(character.deck.filter((cardId) => cardId === character.signatureCard)).toHaveLength(1);
      expect(character.deck.filter((cardId) => cardId === "strike")).toHaveLength(
        character.race === "P" ? 2 : 3,
      );
      expect(assigned.has(character.signatureCard)).toBe(false);
      assigned.add(character.signatureCard);
    }
    expect(assigned.size).toBe(Object.keys(battleContent.characters).length);
  });

  it("generates upgrade variants without losing signature ownership", () => {
    for (const character of Object.values(battleContent.characters)) {
      const upgraded = battleContent.cards[`${character.signatureCard}+`];
      expect(upgraded).toBeTruthy();
      expect(upgraded.signatureFor).toBe(character.id);
    }
  });
});

describe("combat texture mappings", () => {
  it("maps every character to its own combat texture", () => {
    for (const character of Object.values(battleContent.characters)) {
      expect(character.texture).toBe(character.id);
    }
  });

  it("maps every enemy to its own combat texture", () => {
    for (const enemy of Object.values(battleContent.enemies)) {
      expect(enemy.texture).toBe(enemy.id);
    }
  });
});
