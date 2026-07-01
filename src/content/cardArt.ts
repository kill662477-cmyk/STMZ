// 카드 일러스트 자동 연동.
// 승인된 공용 카드 아트를 assets/game/cards/{cardId}.png 로 두면
// 해당 cardId를 사용하는 모든 캐릭터의 카드에 같은 이미지가 자동 표시.
// 캐릭터 전용 아트는 별도 cardId를 가진 시그니처 카드만 사용한다.
// 강화 카드(id+, 예: "strike+")는 기본 카드 아트("strike.png")를 재사용.
// 파일이 없으면 undefined를 반환해 플레이스홀더(타입별 그라데이션+모티프)를 표시.
const cardArtGlob = import.meta.glob("../../assets/game/cards/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const CARD_ART_BY_ID = new Map(
  Object.entries(cardArtGlob).map(([path, url]) => {
    const fileName = path.split("/").at(-1) ?? "";
    return [fileName.replace(/\.png$/, ""), url] as const;
  }),
);

export function cardArtUrl(cardId: string): string | undefined {
  const base = cardId.replace(/\+$/, "");
  return CARD_ART_BY_ID.get(base);
}
