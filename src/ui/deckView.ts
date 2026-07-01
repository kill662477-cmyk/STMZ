import type { CardDef } from "../game/engine/types";

export interface DeckCardGroup {
  card: CardDef;
  count: number;
  upgraded: boolean;
}

export interface DeckViewModel {
  total: number;
  unique: number;
  upgraded: number;
  exhaust: number;
  attacks: number;
  skills: number;
  cards: DeckCardGroup[];
}

const TYPE_ORDER: Record<string, number> = { attack: 0, skill: 1 };
const RARITY_ORDER: Record<string, number> = { common: 0, uncommon: 1, rare: 2 };

/** 런 덱의 중복 카드를 묶고 UI가 필요한 요약 수치를 렌더러와 분리해 계산한다. */
export function buildDeckView(
  deck: readonly string[],
  cardDefs: Readonly<Record<string, CardDef>>,
): DeckViewModel {
  const counts = new Map<string, number>();
  for (const cardId of deck) {
    if (!cardDefs[cardId]) continue;
    counts.set(cardId, (counts.get(cardId) ?? 0) + 1);
  }

  const cards = Array.from(counts, ([cardId, count]) => ({
    card: cardDefs[cardId],
    count,
    upgraded: cardId.endsWith("+"),
  })).sort((left, right) => {
    const typeDifference = TYPE_ORDER[left.card.type] - TYPE_ORDER[right.card.type];
    if (typeDifference !== 0) return typeDifference;
    const rarityDifference = RARITY_ORDER[left.card.rarity] - RARITY_ORDER[right.card.rarity];
    if (rarityDifference !== 0) return rarityDifference;
    const baseNameDifference = left.card.name.replace(/\+$/, "").localeCompare(
      right.card.name.replace(/\+$/, ""),
      "ko",
    );
    if (baseNameDifference !== 0) return baseNameDifference;
    return Number(left.upgraded) - Number(right.upgraded);
  });

  return cards.reduce<DeckViewModel>(
    (view, group) => {
      view.total += group.count;
      view.upgraded += group.upgraded ? group.count : 0;
      view.exhaust += group.card.exhaust ? group.count : 0;
      if (group.card.type === "attack") view.attacks += group.count;
      else view.skills += group.count;
      return view;
    },
    {
      total: 0,
      unique: cards.length,
      upgraded: 0,
      exhaust: 0,
      attacks: 0,
      skills: 0,
      cards,
    },
  );
}
