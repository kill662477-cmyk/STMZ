// 1막 이벤트 노드 콘텐츠. 전투 없이 선택지로 HP·골드·덱을 변화시키는 데이터 정의.
// 각 이벤트는 노드 시드로 결정론적으로 선택되며, 효과는 RunEngine.resolveEvent가 적용한다.

export type EventEffect =
  | { kind: "heal"; amount: number }
  | { kind: "loseHp"; amount: number }
  | { kind: "loseMaxHp"; amount: number }
  | { kind: "gainGold"; amount: number }
  | { kind: "loseGold"; amount: number }
  | { kind: "addCard"; cardId: string };

export interface EventChoice {
  id: string;
  label: string;
  description: string;
  effects: EventEffect[];
}

export interface EventDef {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  choices: EventChoice[];
}

// 첫 번째 선택지는 HP를 바꾸지 않도록 설계한다(런 진행 테스트가 HP 보존을 가정).
export const ACT_ONE_EVENTS: EventDef[] = [
  {
    id: "mysterious_shrine",
    title: "의문의 성소",
    subtitle: "이벤트 · 고요한 기도",
    body: "잔해 더미 속에서 고대의 에너지가 흐르는 성소를 발견했습니다. 이곳에서 무언가를 바치고 기도를 올릴 수 있을 것 같습니다.",
    choices: [
      {
        id: "pray_health",
        label: "체력을 위한 기도",
        description: "최대 체력 5 감소, 15 회복",
        effects: [{ kind: "loseMaxHp", amount: 5 }, { kind: "heal", amount: 15 }],
      },
      {
        id: "pray_wealth",
        label: "재물을 위한 기도",
        description: "골드 60 획득, 피해 5",
        effects: [{ kind: "gainGold", amount: 60 }, { kind: "loseHp", amount: 5 }],
      },
    ],
  },
  {
    id: "lost_merchant",
    title: "길 잃은 상인",
    subtitle: "이벤트 · 외딴 조우",
    body: "수송선을 따라가다 길을 잃고 헤매는 외딴 상인을 만났습니다. 그는 자신의 수레를 지키느라 몹시 지쳐 보입니다.",
    choices: [
      {
        id: "search_cart",
        label: "수레를 수색한다",
        description: "골드 40 획득",
        effects: [{ kind: "gainGold", amount: 40 }],
      },
      {
        id: "leave_it",
        label: "그냥 지나친다",
        description: "아무 일도 일어나지 않는다",
        effects: [],
      },
    ],
  },
  {
    id: "strange_fungus",
    title: "기묘한 버섯",
    subtitle: "이벤트 · 포자 번식지",
    body: "어두운 동굴 구석에서 야광 빛을 내뿜는 포자 버섯 군락을 발견했습니다. 생명력 향상 효과가 있어 보이지만, 독이 있을지도 모릅니다.",
    choices: [
      {
        id: "eat_fungus",
        label: "버섯을 먹는다",
        description: "최대 체력 5 증가, 피해 8",
        effects: [{ kind: "loseMaxHp", amount: -5 }, { kind: "loseHp", amount: 8 }],
      },
      {
        id: "walk_away",
        label: "지나쳐 간다",
        description: "아무 일도 일어나지 않는다",
        effects: [],
      },
    ],
  },

  {
    id: "supply_cache",
    title: "버려진 보급고",
    subtitle: "이벤트 · 폐허의 잔해",
    body: "무너진 초소 안에서 봉인된 보급 상자를 발견했다. 잠금장치가 낡았지만 함정일지도 모른다.",
    choices: [
      {
        id: "pry_open",
        label: "조심스럽게 연다",
        description: "골드 30 획득",
        effects: [{ kind: "gainGold", amount: 30 }],
      },
      {
        id: "force_open",
        label: "강제로 부순다",
        description: "골드 55 획득, 피해 8",
        effects: [
          { kind: "gainGold", amount: 55 },
          { kind: "loseHp", amount: 8 },
        ],
      },
    ],
  },
  {
    id: "scout_relic",
    title: "정찰병의 유산",
    subtitle: "이벤트 · 쓰러진 전우",
    body: "먼저 떠난 정찰병의 잔해 곁에 손때 묻은 장비가 남아 있다. 무엇을 챙길지 정해야 한다.",
    choices: [
      {
        id: "take_card",
        label: "속사 교본을 챙긴다",
        description: "덱에 '속사' 추가",
        effects: [{ kind: "addCard", cardId: "quickshot" }],
      },
      {
        id: "field_dressing",
        label: "응급 키트를 쓴다",
        description: "체력 12 회복",
        effects: [{ kind: "heal", amount: 12 }],
      },
    ],
  },
  {
    id: "wandering_dealer",
    title: "떠도는 밀매상",
    subtitle: "이벤트 · 수상한 거래",
    body: "후드를 깊게 눌러쓴 자가 잔해 더미에서 장비를 내민다. 값은 미리 받겠다고 한다.",
    choices: [
      {
        id: "buy_bulwark",
        label: "철갑 진지를 산다 (골드 40)",
        description: "골드 40 소비, 덱에 '철갑 진지' 추가",
        effects: [
          { kind: "loseGold", amount: 40 },
          { kind: "addCard", cardId: "bulwark" },
        ],
      },
      {
        id: "walk_away",
        label: "돌아선다",
        description: "아무 일도 없다",
        effects: [],
      },
    ],
  },
];

export const ACT_TWO_EVENTS: EventDef[] = [
  {
    id: "ancient_terminal",
    title: "고대 정거장 단말기",
    subtitle: "이벤트 · 버려진 데이터",
    body: "전원이 켜진 채 방치된 단말기를 발견했습니다. 누군가 접속 권한을 남겨둔 것 같습니다.",
    choices: [
      {
        id: "download_data",
        label: "전투 데이터를 다운로드한다",
        description: "덱에 '위상 포격' 추가",
        effects: [{ kind: "addCard", cardId: "phase_cannon" }],
      },
      {
        id: "extract_power",
        label: "동력원을 추출한다",
        description: "최대 체력 5 감소, 골드 75 획득",
        effects: [
          { kind: "loseMaxHp", amount: 5 },
          { kind: "gainGold", amount: 75 },
        ],
      },
    ],
  },
  {
    id: "mysterious_capsule",
    title: "의문의 캡슐",
    subtitle: "이벤트 · 심연의 유물",
    body: "푸른 빛을 내뿜는 캡슐이 길을 막고 있습니다. 강한 에너지가 느껴집니다.",
    choices: [
      {
        id: "absorb_energy",
        label: "에너지를 흡수한다",
        description: "체력 20 회복",
        effects: [{ kind: "heal", amount: 20 }],
      },
      {
        id: "leave_capsule",
        label: "무시하고 지나간다",
        description: "아무 일도 없다",
        effects: [],
      },
    ],
  },
];

export const ACT_THREE_EVENTS: EventDef[] = [
  {
    id: "abyssal_rift",
    title: "심연의 균열",
    subtitle: "이벤트 · 공간 왜곡",
    body: "불길한 기운이 뿜어져 나오는 차원 균열입니다. 무언가 떨어져 있습니다.",
    choices: [
      {
        id: "reach_in",
        label: "균열 안으로 손을 뻗는다",
        description: "피해 15, 골드 100 획득",
        effects: [
          { kind: "loseHp", amount: 15 },
          { kind: "gainGold", amount: 100 },
        ],
      },
      {
        id: "avoid_rift",
        label: "물러난다",
        description: "아무 일도 없다",
        effects: [],
      },
    ],
  },
];

export function getEventsForAct(act: number): EventDef[] {
  if (act === 1) return ACT_ONE_EVENTS;
  if (act === 2) return ACT_TWO_EVENTS;
  return ACT_THREE_EVENTS;
}

export function getAllEvents(): EventDef[] {
  return [...ACT_ONE_EVENTS, ...ACT_TWO_EVENTS, ...ACT_THREE_EVENTS];
}
