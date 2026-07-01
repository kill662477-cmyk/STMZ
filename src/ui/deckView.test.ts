import { describe, expect, it } from "vitest";
import { battleContent } from "../content/battleContent";
import { buildDeckView } from "./deckView";

describe("buildDeckView", () => {
  it("groups the starting deck and reports its composition", () => {
    const deck = battleContent.characters.jdd.deck;

    const view = buildDeckView(deck, battleContent.cards);

    expect(view).toMatchObject({
      total: 10,
      unique: 6,
      upgraded: 0,
      exhaust: 0,
      attacks: 6,
      skills: 4,
    });
    expect(view.cards.find(({ card }) => card.id === "strike")?.count).toBe(3);
    expect(view.cards.find(({ card }) => card.id === "guard")?.count).toBe(3);
    expect(view.cards.find(({ card }) => card.id === "jdd_signature")?.count).toBe(1);
  });

  it("keeps upgraded cards separate and counts exhaust copies", () => {
    const view = buildDeckView(
      ["strike", "strike+", "strike+", "adrenaline", "adrenaline"],
      battleContent.cards,
    );

    expect(view).toMatchObject({
      total: 5,
      unique: 3,
      upgraded: 2,
      exhaust: 2,
      attacks: 3,
      skills: 2,
    });
    expect(view.cards.find(({ card }) => card.id === "strike+")?.count).toBe(2);
    expect(view.cards.find(({ card }) => card.id === "adrenaline")?.card.rarity).toBe("rare");
  });

  it("ignores unknown card ids instead of breaking the viewer", () => {
    const view = buildDeckView(["strike", "missing-card"], battleContent.cards);

    expect(view.total).toBe(1);
    expect(view.cards.map(({ card }) => card.id)).toEqual(["strike"]);
  });
});
