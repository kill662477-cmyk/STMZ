import { Rng } from "../engine/rng";
import type { RunNode } from "./types";

export interface ActEncounter {
  id: string;
  subtitle: string;
}

export interface InterleavedActConfig {
  act: number;
  seedSalt: number;
  normalEncounters: readonly ActEncounter[];
  battleNames: readonly (readonly string[])[];
  eventTitles: readonly string[];
  shopTitles: readonly string[];
  eliteTitle: string;
  eliteEncounterId: string;
  treasureTitles: readonly string[];
  restTitles: readonly string[];
  bossTitle: string;
  bossSubtitle: string;
  bossEncounterId: string;
}

type FloorKind = "battle" | "event" | "duo" | "hub" | "treasure" | "rest" | "boss";

interface FloorLayout {
  floor: number;
  idSegment: string;
  kind: FloorKind;
  lanes: readonly number[];
  battleNameIndex?: number;
  duoIndex?: number;
}

// 기존 7층 노드의 ID(f1~f7)는 의미를 그대로 보존한다. f3b/f4b/f5b만
// 새로 삽입하므로 기존 저장은 현재 이벤트·상점·보물·휴식·보스 노드를
// 잘못된 종류로 복원하지 않는다.
function getFloorLayout(ascension: number): FloorLayout[] {
  const baseLayout: FloorLayout[] = [
    { floor: 1, idSegment: "f1", kind: "battle", lanes: [1, 3], battleNameIndex: 0 },
    { floor: 2, idSegment: "f2", kind: "battle", lanes: [0, 2, 4], battleNameIndex: 1 },
    { floor: 3, idSegment: "f3", kind: "event", lanes: [1, 3] },
    { floor: 4, idSegment: "f3b", kind: "duo", lanes: [0, 2, 4], battleNameIndex: 2, duoIndex: 0 },
    { floor: 5, idSegment: "f4", kind: "hub", lanes: [0, 2, 4] },
    { floor: 6, idSegment: "f4b", kind: "duo", lanes: [1, 3], battleNameIndex: 3, duoIndex: 1 },
    { floor: 7, idSegment: "f5", kind: "treasure", lanes: [1, 3] },
    { floor: 8, idSegment: "f5b", kind: "duo", lanes: [0, 2, 4], battleNameIndex: 4, duoIndex: 2 },
    { floor: 9, idSegment: "f6", kind: "rest", lanes: [1, 3] },
    { floor: 10, idSegment: "f7", kind: "boss", lanes: [2] },
  ];

  if (ascension === 1) {
    return baseLayout.map(layout => 
      layout.kind === "duo" ? { ...layout, kind: "battle" } : layout
    );
  }

  if (ascension >= 3) {
    const extendedLayout: FloorLayout[] = [
      ...baseLayout.slice(0, 8),
      { floor: 9, idSegment: "f6a", kind: "battle", lanes: [1, 3], battleNameIndex: 5 },
      { floor: 10, idSegment: "f6b", kind: "duo", lanes: [0, 2, 4], battleNameIndex: 6, duoIndex: 3 },
      { floor: 11, idSegment: "f6", kind: "rest", lanes: [1, 3] },
      { floor: 12, idSegment: "f7", kind: "boss", lanes: [2] },
    ];
    if (ascension >= 4) {
      // Increase cross-connections for asc 4+ by modifying lanes later during link generation,
      // but for now, we just ensure more duo encounters.
      extendedLayout[1].kind = "duo";
      extendedLayout[1].duoIndex = 4;
    }
    return extendedLayout;
  }

  return baseLayout;
}


function encounterPair(
  encounters: readonly ActEncounter[],
  duoIndex: number,
  nodeIndex: number,
): [ActEncounter, ActEncounter] {
  if (encounters.length < 2) throw new Error("Duo battles require at least two encounters.");
  const firstIndex = (duoIndex + nodeIndex) % encounters.length;
  const secondIndex = (firstIndex + 1) % encounters.length;
  return [encounters[firstIndex], encounters[secondIndex]];
}

export function createInterleavedActMap(seed: number, config: InterleavedActConfig, ascension: number = 1): RunNode[] {
  const rng = new Rng(seed ^ config.seedSalt);
  const encounters = rng.shuffle(config.normalEncounters);

  const floors: RunNode[][] = getFloorLayout(ascension).map((layout) =>
    layout.lanes.map((lane, index) => {
      const base = {
        id: `a${config.act}-${layout.idSegment}-n${index}`,
        act: config.act,
        floor: layout.floor,
        lane,
        nextIds: [],
      };

      if (layout.kind === "boss") {
        return {
          ...base,
          type: "boss",
          title: config.bossTitle,
          subtitle: config.bossSubtitle,
          encounterId: config.bossEncounterId,
          encounterIds: [config.bossEncounterId],
        } satisfies RunNode;
      }

      if (layout.kind === "rest") {
        return {
          ...base,
          type: "rest",
          title: config.restTitles[index % config.restTitles.length],
          subtitle: "휴식 · 회복 또는 강화",
        } satisfies RunNode;
      }

      if (layout.kind === "event") {
        return {
          ...base,
          type: "event",
          title: config.eventTitles[index % config.eventTitles.length],
          subtitle: "이벤트 · 선택의 갈림길",
        } satisfies RunNode;
      }

      if (layout.kind === "hub") {
        if (index === 1) {
          return {
            ...base,
            type: "elite",
            title: config.eliteTitle,
            subtitle: "엘리트 · 강적 · 유물 확정",
            encounterId: config.eliteEncounterId,
            encounterIds: [config.eliteEncounterId],
          } satisfies RunNode;
        }
        const shopIndex = index < 1 ? index : index - 1;
        return {
          ...base,
          type: "shop",
          title: config.shopTitles[shopIndex % config.shopTitles.length],
          subtitle: "상점 · 카드 구매·제거",
        } satisfies RunNode;
      }

      if (layout.kind === "treasure") {
        return {
          ...base,
          type: "treasure",
          title: config.treasureTitles[index % config.treasureTitles.length],
          subtitle: "보물 · 유물 3중1",
        } satisfies RunNode;
      }

      const names = config.battleNames[(layout.battleNameIndex ?? 0) % config.battleNames.length];
      if (layout.kind === "duo") {
        const [first, second] = encounterPair(encounters, layout.duoIndex ?? 0, index);
        return {
          ...base,
          type: "battle",
          title: names[index % names.length],
          subtitle: `${first.subtitle} + ${second.subtitle} · 2체`,
          encounterId: first.id,
          encounterIds: [first.id, second.id],
        } satisfies RunNode;
      }

      const encounterIndex =
        layout.floor === 1 ? index : (index + 1) % encounters.length;
      const encounter = encounters[encounterIndex];
      return {
        ...base,
        type: "battle",
        title: names[index % names.length],
        subtitle: encounter.subtitle,
        encounterId: encounter.id,
        encounterIds: [encounter.id],
      } satisfies RunNode;
    }),
  );

  for (let floorIndex = 0; floorIndex < floors.length - 1; floorIndex++) {
    const current = floors[floorIndex];
    const next = floors[floorIndex + 1];
    
    // 승천 4단계 이상: 모든 노드가 더 많은 다음 노드와 연결됨 (경로 복잡화)
    const linkCount = ascension >= 4 ? 3 : 2;
    
    for (const node of current) {
      node.nextIds = [...next]
        .sort((a, b) => Math.abs(a.lane - node.lane) - Math.abs(b.lane - node.lane))
        .slice(0, Math.min(linkCount, next.length))
        .map((candidate) => candidate.id);
    }

    for (const nextNode of next) {
      const hasIncoming = current.some((node) => node.nextIds.includes(nextNode.id));
      if (!hasIncoming) {
        const nearest = [...current].sort(
          (a, b) => Math.abs(a.lane - nextNode.lane) - Math.abs(b.lane - nextNode.lane),
        )[0];
        if (!nearest.nextIds.includes(nextNode.id)) {
          nearest.nextIds.push(nextNode.id);
        }
      }
    }
  }

  return floors.flat();
}
