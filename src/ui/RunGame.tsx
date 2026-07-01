import { useCallback, useEffect, useReducer, useRef, useState, type CSSProperties } from "react";
import { audioManager } from "../game/audio/AudioManager";
import { sfx } from "../game/audio/SfxManager";
import stageBgAct1Url from "../../assets/game/stage_bg_act1.png";
import stageBgAct2Url from "../../assets/game/stage_bg_act2.png";
import stageBgAct3Url from "../../assets/game/stage_bg_act3.png";
import { battleContent } from "../content/battleContent";
import { cardArtUrl } from "../content/cardArt";
import { RELICS } from "../content/relics";
import { MAX_POTIONS, POTIONS } from "../content/potions";
import type { BattleEngine, BattleEvent } from "../game/engine/BattleEngine";
import type { CardDef } from "../game/engine/types";
import { RunEngine } from "../game/run/RunEngine";
import { createRunBattle, resolveRunBattle } from "../game/run/runBattle";
import {
  clearRunSave,
  loadRun,
  saveRun,
  getUnlockedAscension,
  unlockNextAscension,
  syncCloudData,
  type LoadedRun,
  type RunStorage,
} from "../game/run/runPersistence";
import type { RunNode } from "../game/run/types";
import { BattleScreen } from "./BattleScreen";
import { buildDeckView } from "./deckView";

const MAP_WIDTH = 500;
const MAP_HEIGHT = 620;

const NODE_LABEL: Record<string, string> = {
  boss: "보스",
  rest: "휴식",
  battle: "전투",
  elite: "엘리트",
  event: "이벤트",
  shop: "상점",
  treasure: "보물",
};

// 막별 테마 문구(이미지 없이 텍스트만). 보스/적은 battleContent가 막별로 다르다.
const ACT_THEME: Record<number, { label: string; location: string; mapTitle: string }> = {
  1: { label: "1막", location: "황혼의 폐허", mapTitle: "군체의 왕좌로 향하는 길" },
  2: { label: "2막", location: "공명하는 심연", mapTitle: "심연의 돌격수를 향해" },
  3: { label: "3막", location: "성간의 종말", mapTitle: "성간 전함을 향한 최종 결전" },
};
function actTheme(act: number) {
  return ACT_THEME[act] ?? ACT_THEME[1];
}

type RunStyle = CSSProperties & { "--run-background": string };

function createRun(characterId: string, ascension: number): RunEngine {
  return new RunEngine(battleContent, {
    characterId,
    seed: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
    ascension,
  });
}

function browserStorage(): RunStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function readSavedRun(): LoadedRun | null {
  const storage = browserStorage();
  return storage ? loadRun(storage, battleContent) : null;
}

function persistRun(run: RunEngine): void {
  const storage = browserStorage();
  if (!storage) return;
  try {
    saveRun(storage, run.state);
  } catch {
    // 저장소가 차단된 환경에서도 현재 세션 플레이는 계속 허용한다.
  }
}

function floorPositionY(floor: number, floorCount: number): number {
  const top = 42;
  const bottom = 578;
  const gap = floorCount > 1 ? (bottom - top) / (floorCount - 1) : 0;
  return bottom - (floor - 1) * gap;
}

function nodePosition(node: RunNode, floorCount: number) {
  return {
    x: 65 + node.lane * 92.5,
    y: floorPositionY(node.floor, floorCount),
  };
}

export function RunGame() {
  const [savedRun, setSavedRun] = useState<LoadedRun | null>(readSavedRun);
  const [run, setRun] = useState(() => createRun("jdd", 1));
  const [showStart, setShowStart] = useState(true);
  const [selectingChar, setSelectingChar] = useState(false);
  const [battle, setBattle] = useState<BattleEngine | null>(null);
  const [usedPotionSlots, setUsedPotionSlots] = useState<number[]>([]);
  const [notice, setNotice] = useState("");
  const [globalDeckOpen, setGlobalDeckOpen] = useState(false);
  const [globalMapOpen, setGlobalMapOpen] = useState(false);
  const [, refresh] = useReducer((value) => value + 1, 0);
  const RUN_BG_BY_ACT: Record<number, string> = {
    1: stageBgAct1Url,
    2: stageBgAct2Url,
    3: stageBgAct3Url,
  };
  const backgroundStyle: RunStyle = { "--run-background": `url(${RUN_BG_BY_ACT[run.state.act] ?? stageBgAct1Url})` };

  // ── BGM: 막 변경·화면 전환 시 자동 재생 ──
  useEffect(() => {
    if (showStart) {
      audioManager.playMenu();
    } else {
      audioManager.playAct(run.state.act);
    }
  }, [showStart, run.state.act]);

  // ── Cloud Save Sync ──
  useEffect(() => {
    const storage = browserStorage();
    if (!storage) return;

    syncCloudData(storage, battleContent).then((result) => {
      if (!result) return;
      let updated = false;
      if (result.run) {
        setSavedRun({
          run: result.run,
          savedAt: new Date().toISOString(),
        });
        updated = true;
      }
      if (result.meta) {
        refresh();
        updated = true;
      }
      if (updated) {
        setNotice("클라우드 저장소와 동기화되었습니다.");
        setTimeout(() => setNotice(""), 3000);
      }
    }).catch((err) => {
      console.error("Cloud sync failed:", err);
    });
  }, []);

  function continueRun() {
    if (!savedRun) return;
    const next = savedRun.run;
    
    // 전투 도중 강제 종료(새로고침 등) 시 사망(런 포기) 처리 (하드코어/꼼수 방지)
    if (next.state.phase === "battle") {
      alert("전투 도중 게임이 종료(이탈)되어 캐릭터가 사망 처리되었습니다.");
      const storage = browserStorage();
      if (storage) clearRunSave(storage);
      window.location.reload();
      return;
    }

    setRun(next);
    setBattle(null); // 전투 상태로 불러와지지 않음 (위에서 걸러짐)
    setUsedPotionSlots([]);
    setShowStart(false);
    setNotice("");
  }

  function startNewRun(characterId: string, ascension: number) {
    const storage = browserStorage();
    if (storage) {
      try {
        clearRunSave(storage);
      } catch {
        // 새 런은 저장소 삭제 실패와 무관하게 시작할 수 있다.
      }
    }
    const next = createRun(characterId, ascension);
    persistRun(next);
    setSavedRun(null);
    setRun(next);
    setBattle(null);
    setUsedPotionSlots([]);
    setShowStart(false);
    setSelectingChar(false);
    setNotice("");
  }

  if (showStart && selectingChar) {
    const storage = browserStorage();
    const maxAscension = storage ? getUnlockedAscension(storage) : 1;
    return (
      <CharacterSelect
        onSelect={startNewRun}
        onBack={() => setSelectingChar(false)}
        style={backgroundStyle}
        maxAscension={maxAscension}
      />
    );
  }

  if (showStart) {
    return (
      <RunStartScreen
        savedRun={savedRun}
        onContinue={continueRun}
        onNew={() => setSelectingChar(true)}
        style={backgroundStyle}
      />
    );
  }

  function startNode(nodeId: string) {
    try {
      run.startNode(nodeId);
      sfx.nodeSelect();
      if (run.state.phase === "battle") {
        setBattle(createRunBattle(battleContent, run));
        setUsedPotionSlots([]);
      }
      persistRun(run);
      setNotice("");
      refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "노드에 진입할 수 없습니다.");
    }
  }

  function restHeal() {
    try {
      const amount = run.restHealAmount();
      run.restHeal();
      sfx.heal();
      persistRun(run);
      setNotice(`체력을 ${amount} 회복했습니다.`);
      refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "휴식할 수 없습니다.");
    }
  }

  function restUpgrade(cardId: string) {
    try {
      const name = battleContent.cards[cardId]?.name ?? cardId;
      run.restUpgrade(cardId);
      sfx.upgrade();
      persistRun(run);
      setNotice(`${name} 카드를 강화했습니다.`);
      refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "강화할 수 없습니다.");
    }
  }

  function resolveEvent(choiceId: string) {
    try {
      run.resolveEvent(choiceId);
      persistRun(run);
      setNotice("");
      refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "이벤트를 진행할 수 없습니다.");
    }
  }

  function buyShopItem(itemId: string) {
    try {
      run.buyShopItem(itemId);
      sfx.purchase();
      persistRun(run);
      setNotice("카드를 구매했습니다.");
      refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "구매할 수 없습니다.");
    }
  }

  function buyShopRelic(itemId: string) {
    try {
      run.buyShopRelic(itemId);
      sfx.purchase();
      sfx.relicGain();
      persistRun(run);
      setNotice("유물을 구매했습니다.");
      refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "유물을 구매할 수 없습니다.");
    }
  }

  function buyShopPotion(itemId: string) {
    try {
      run.buyShopPotion(itemId);
      sfx.purchase();
      persistRun(run);
      setNotice("포션을 구매했습니다.");
      refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "포션을 구매할 수 없습니다.");
    }
  }

  function removeCard(cardId: string) {
    try {
      const name = battleContent.cards[cardId]?.name ?? cardId;
      run.removeCard(cardId);
      persistRun(run);
      setNotice(`${name} 카드를 덱에서 제거했습니다.`);
      refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "제거할 수 없습니다.");
    }
  }

  function leaveShop() {
    try {
      run.leaveShop();
      persistRun(run);
      setNotice("");
      refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "상점을 나갈 수 없습니다.");
    }
  }

  // 전투 중 포션 사용. 효과는 즉시 BattleEngine에 적용하고, 슬롯 소모는 전투 종료 시 확정한다.
  // (전투 중에는 RunState를 바꾸지 않으므로 새로고침하면 포션이 그대로 복원된다.)
  function useBattlePotion(slot: number): BattleEvent[] {
    if (!battle) return [];
    const potionId = run.state.potions[slot];
    const def = potionId ? POTIONS[potionId] : undefined;
    if (!def || usedPotionSlots.includes(slot)) return [];
    const events = battle.usePotion(def.effect);
    setUsedPotionSlots((prev) => [...prev, slot]);
    return events;
  }

  function takeRewardPotion() {
    try {
      const potionId = run.state.reward?.potionId;
      const name = potionId ? POTIONS[potionId]?.name ?? potionId : "포션";
      run.takeRewardPotion();
      sfx.potionUse();
      persistRun(run);
      setNotice(`${name}을(를) 획득했습니다.`);
      refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "포션을 받을 수 없습니다.");
    }
  }

  function finishBattle() {
    if (!battle) return;
    try {
      resolveRunBattle(run, battle);
      if (usedPotionSlots.length > 0) run.removePotions(usedPotionSlots);
      setUsedPotionSlots([]);
      persistRun(run);
      setBattle(null);
      setNotice("");
      refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "전투 결과를 반영할 수 없습니다.");
    }
  }

  function chooseReward(cardId: string | null) {
    try {
      run.chooseReward(cardId);
      if (cardId) sfx.goldGain();
      persistRun(run);
      setNotice(cardId ? "선택한 카드가 덱에 추가되었습니다." : "카드 보상을 건너뛰었습니다.");
      refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "보상을 선택할 수 없습니다.");
    }
  }

  function chooseTreasure(relicId: string | null) {
    try {
      run.chooseTreasure(relicId);
      if (relicId) sfx.relicGain();
      persistRun(run);
      setNotice(relicId ? "유물을 획득했습니다." : "보물을 건너뛰었습니다.");
      refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "보물을 처리할 수 없습니다.");
    }
  }

  function chooseBossReward(cardId: string | null, relicId: string | null) {
    try {
      run.chooseBossReward(cardId, relicId);
      if (relicId) sfx.relicGain();
      if (cardId) sfx.goldGain();
      persistRun(run);
      setBattle(null);
      setUsedPotionSlots([]);
      setNotice("");
      refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "보스 보상을 처리할 수 없습니다.");
    }
  }

  function restartRun() {
    setShowStart(true);
    setSelectingChar(true);
    setBattle(null);
    setUsedPotionSlots([]);
    setNotice("");
  }

  if (run.state.phase === "battle" && battle) {
    const battlePotions = run.state.potions
      .map((id, slot) => ({ slot, id }))
      .filter(({ slot }) => !usedPotionSlots.includes(slot));
    return (
      <>
        <BattleScreen
          engine={battle}
          floor={run.currentNode?.floor ?? 1}
          nodeTitle={run.currentNode?.title ?? "전투"}
          act={run.state.act}
          potions={battlePotions}
          relics={run.state.relics}
          onUsePotion={useBattlePotion}
          onResolve={finishBattle}
          onOpenDeck={() => setGlobalDeckOpen(true)}
          onOpenMap={() => setGlobalMapOpen(true)}
        />
        {globalDeckOpen && <DeckViewer deck={run.state.deck} onClose={() => setGlobalDeckOpen(false)} />}
        {globalMapOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "var(--bg-base)" }}>
            <MapScreen run={run} notice="전투 중에는 경로를 선택할 수 없습니다." onStartNode={() => {}} style={backgroundStyle} />
            <button onClick={() => setGlobalMapOpen(false)} className="overlay-close-btn" style={{ position: "absolute", top: "20px", right: "20px", padding: "10px 20px", background: "rgba(0,0,0,0.8)", border: "2px solid #5a4a3a", color: "#e8dcc8", cursor: "pointer", borderRadius: "8px", fontSize: "16px", zIndex: 1100 }}>
              돌아가기
            </button>
          </div>
        )}
      </>
    );
  }

  if (run.state.phase === "reward" && run.state.reward) {
    return (
      <RewardScreen
        run={run}
        notice={notice}
        onChoose={chooseReward}
        onTakePotion={takeRewardPotion}
        style={backgroundStyle}
      />
    );
  }

  if (run.state.phase === "rest") {
    return (
      <RestScreen
        run={run}
        notice={notice}
        onHeal={restHeal}
        onUpgrade={restUpgrade}
        style={backgroundStyle}
      />
    );
  }

  if (run.state.phase === "event") {
    return (
      <EventScreen run={run} notice={notice} onChoose={resolveEvent} style={backgroundStyle} />
    );
  }

  if (run.state.phase === "shop") {
    return (
      <ShopScreen
        run={run}
        notice={notice}
        onBuy={buyShopItem}
        onBuyRelic={buyShopRelic}
        onBuyPotion={buyShopPotion}
        onRemove={removeCard}
        onLeave={leaveShop}
        style={backgroundStyle}
      />
    );
  }

  if (run.state.phase === "treasure") {
    return (
      <TreasureScreen
        run={run}
        notice={notice}
        onChoose={chooseTreasure}
        style={backgroundStyle}
      />
    );
  }

  if (run.state.phase === "boss_reward") {
    return (
      <BossRewardScreen
        run={run}
        onChoose={chooseBossReward}
        style={backgroundStyle}
      />
    );
  }

  if (run.state.phase === "won" || run.state.phase === "lost") {
    return <RunResult run={run} onRestart={restartRun} style={backgroundStyle} />;
  }

  return (
    <MapScreen
      run={run}
      notice={notice}
      onStartNode={startNode}
      style={backgroundStyle}
    />
  );
}

const RACE_LABEL: Record<string, string> = { T: "테란", P: "프로토스", Z: "저그" };
const RACE_COLOR: Record<string, string> = { T: "#c08838", P: "#c8a030", Z: "#5cb860" };

function CharacterSelect({
  onSelect,
  onBack,
  style,
  maxAscension,
}: {
  onSelect: (characterId: string, ascension: number) => void;
  onBack: () => void;
  style: RunStyle;
  maxAscension: number;
}) {
  const [activeTab, setActiveTab] = useState<"T" | "P" | "Z">("T");
  const [ascension, setAscension] = useState(maxAscension);
  const charList = Object.values(battleContent.characters).filter((ch) => ch.race === activeTab);
  return (
    <div className="run-shell charselect-shell" style={style}>
      <main className="charselect-layout">
        <div className="charselect-header">
          <button type="button" className="charselect-back" onClick={onBack}>
            ← 뒤로
          </button>
          <h1>캐릭터 선택</h1>
        </div>
        <div className="charselect-tabs">
          <button className={activeTab === "T" ? "active" : ""} onClick={() => setActiveTab("T")}>테란 (Terran)</button>
          <button className={activeTab === "P" ? "active" : ""} onClick={() => setActiveTab("P")}>프로토스 (Protoss)</button>
          <button className={activeTab === "Z" ? "active" : ""} onClick={() => setActiveTab("Z")}>저그 (Zerg)</button>
        </div>
        <div className="charselect-grid">
          {charList.map((ch) => {
            const relic = ch.startingRelic ? RELICS[ch.startingRelic] : null;
            const signature = battleContent.cards[ch.signatureCard];
            return (
              <button
                key={ch.id}
                type="button"
                className="char-card"
                style={{ "--race-color": RACE_COLOR[ch.race] } as CSSProperties}
                onClick={() => onSelect(ch.id, ascension)}
              >
                <div className="char-info">
                  <span className="char-race-badge">{RACE_LABEL[ch.race] ?? ch.race}</span>
                  <strong className="char-name">{ch.name}</strong>
                  <span className="char-hp">HP {ch.maxHp}</span>
                  {relic && <small className="char-relic">시작: {relic.name}</small>}
                  {signature && <small className="char-signature">고유: {signature.name}</small>}
                </div>
              </button>
            );
          })}
        </div>
        <div className="charselect-ascension">
          <label htmlFor="ascension-slider">승천 단계 (1 ~ 5)</label>
          <div className="ascension-control">
            <input
              id="ascension-slider"
              type="range"
              min="1"
              max={Math.max(1, maxAscension)}
              step="1"
              value={ascension}
              onChange={(e) => setAscension(parseInt(e.target.value, 10))}
            />
            <span className="ascension-value">{ascension}단계</span>
          </div>
          <p className="ascension-desc">
            {ascension === 1 && "기본 난이도. 모든 적이 1마리씩 등장합니다."}
            {ascension === 2 && "적의 능력치가 약간 상승하고 다수의 적이 등장합니다."}
            {ascension === 3 && "적의 능력치가 더 상승하고 맵의 전투 횟수가 늘어납니다."}
            {ascension === 4 && "경로가 복잡해지며 다중 전투의 빈도가 크게 증가합니다."}
            {ascension === 5 && "적의 능력치가 대폭 상승하며 치명적인 위험이 도사립니다."}
          </p>
        </div>
      </main>
    </div>
  );
}

function StartAudioControl() {
  const [bgmVol, setBgmVol] = useState(audioManager.getVolume());
  const [bgmMuted, setBgmMuted] = useState(audioManager.isMuted());
  const [sfxVol, setSfxVol] = useState(sfx.getVolume());
  const [sfxMuted, setSfxMuted] = useState(sfx.isMuted());
  
  return (
    <div className="audio-control-start">
      <div className="bgm-control" aria-label="BGM 음량">
        <button
          type="button"
          className={`bgm-mute-btn${bgmMuted ? " muted" : ""}`}
          onClick={() => { const m = audioManager.toggleMute(); setBgmMuted(m); }}
          aria-label={bgmMuted ? "BGM 음소거 해제" : "BGM 음소거"}
          title={bgmMuted ? "BGM 음소거 해제" : "BGM 음소거"}
        >
          {bgmMuted ? "🎵🔇" : bgmVol > 0.5 ? "🎵🔊" : bgmVol > 0 ? "🎵🔉" : "🎵🔈"}
        </button>
        <input
          type="range"
          className="bgm-volume-slider"
          min="0" max="1" step="0.05"
          value={bgmMuted ? 0 : bgmVol}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            audioManager.setVolume(v);
            setBgmVol(v);
            if (bgmMuted && v > 0) { audioManager.toggleMute(); setBgmMuted(false); }
          }}
          aria-label="BGM 음량"
          title={`BGM ${Math.round((bgmMuted ? 0 : bgmVol) * 100)}%`}
        />
      </div>
      <div className="bgm-control" aria-label="효과음 음량">
        <button
          type="button"
          className={`bgm-mute-btn${sfxMuted ? " muted" : ""}`}
          onClick={() => { const m = sfx.toggleMute(); setSfxMuted(m); }}
          aria-label={sfxMuted ? "효과음 음소거 해제" : "효과음 음소거"}
          title={sfxMuted ? "효과음 음소거 해제" : "효과음 음소거"}
        >
          {sfxMuted ? "💥🔇" : sfxVol > 0.5 ? "💥🔊" : sfxVol > 0 ? "💥🔉" : "💥🔈"}
        </button>
        <input
          type="range"
          className="bgm-volume-slider"
          min="0" max="1" step="0.05"
          value={sfxMuted ? 0 : sfxVol}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            sfx.setVolume(v);
            setSfxVol(v);
            if (sfxMuted && v > 0) { sfx.toggleMute(); setSfxMuted(false); }
          }}
          aria-label="효과음 음량"
          title={`SFX ${Math.round((sfxMuted ? 0 : sfxVol) * 100)}%`}
        />
      </div>
    </div>
  );
}

function RunStartScreen({
  savedRun,
  onContinue,
  onNew,
  style,
}: {
  savedRun: LoadedRun | null;
  onContinue: () => void;
  onNew: () => void;
  style: RunStyle;
}) {
  const [confirmNew, setConfirmNew] = useState(false);
  const saved = savedRun?.run;
  const localFloor = saved?.currentNode?.floor ?? ((saved?.state.completedNodeIds.length ?? 0) + 1);
  const currentFloor = saved ? ((saved.state.act - 1) * 10) + localFloor : 1;
  const savedAt = savedRun
    ? new Date(savedRun.savedAt).toLocaleString("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;


  return (
    <div className="run-shell start-shell" style={style}>
      <main className="start-layout">
        <div className="start-copy">
          <span className="run-kicker">TURN-BASED ROGUELIKE DECKBUILDER</span>
          <div className="start-logo">
            SLAY THE <span>MONSTARZ</span>
          </div>
          <h1>3막의 끝까지<br />살아남으라</h1>
          <p>경로를 고르고, 덱을 다듬고, 성간 전함까지 돌파하세요.</p>
        </div>

        {saved && (
          <section className="continue-card" aria-label="저장된 런">
            <span>저장된 런</span>
            <strong>{actTheme(saved.state.act).label} · {currentFloor}층</strong>
            <div>
              <span>체력 {saved.state.hp}/{saved.state.maxHp}</span>
              <span>골드 {saved.state.gold}</span>
              <span>덱 {saved.state.deck.length}장</span>
            </div>
            {savedAt && <small>{savedAt} 자동 저장</small>}
          </section>
        )}

        <div className="start-actions">
          {saved ? (
            <>
              <button className="start-primary" type="button" onClick={onContinue}>
                이어하기
              </button>
              <button
                className={`start-secondary${confirmNew ? " confirm" : ""}`}
                type="button"
                onClick={() => {
                  if (confirmNew) onNew();
                  else setConfirmNew(true);
                }}
              >
                {confirmNew ? "저장된 런을 지우고 시작" : "새 런 시작"}
              </button>
            </>
          ) : (
            <button className="start-primary" type="button" onClick={onNew}>
              새 런 시작
            </button>
          )}
        </div>
        <StartAudioControl />
        <small className="autosave-note">노드 진행마다 자동 저장됩니다.</small>
      </main>
    </div>
  );
}

interface RunViewProps {
  run: RunEngine;
  style: RunStyle;
}

function getRelicIcon(id: string): React.ReactNode {
  return (
    <img
      src={`assets/relics/${id}.png`}
      alt=""
      className="item-icon-img"
      onError={(e) => {
        const target = e.currentTarget;
        target.style.display = "none";
        const fallback = document.createElement("span");
        fallback.textContent = "🔮";
        fallback.className = "item-icon-emoji";
        target.parentElement?.insertBefore(fallback, target);
      }}
    />
  );
}

function getPotionIcon(id: string): React.ReactNode {
  return (
    <img
      src={`assets/potions/${id}.png`}
      alt=""
      className="item-icon-img"
      onError={(e) => {
        const target = e.currentTarget;
        target.style.display = "none";
        const fallback = document.createElement("span");
        fallback.textContent = "🧪";
        fallback.className = "item-icon-emoji";
        target.parentElement?.insertBefore(fallback, target);
      }}
    />
  );
}

function RunHeader({ run }: { run: RunEngine }) {
  const [deckOpen, setDeckOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bgmVol, setBgmVol] = useState(audioManager.getVolume());
  const [bgmMuted, setBgmMuted] = useState(audioManager.isMuted());
  const [sfxVol, setSfxVol] = useState(sfx.getVolume());
  const [sfxMuted, setSfxMuted] = useState(sfx.isMuted());
  const [, force] = useReducer((x: number) => x + 1, 0);
  const deckButtonRef = useRef<HTMLButtonElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const relics = run.state.relics.map((id) => RELICS[id]).filter(Boolean);
  const potions = run.state.potions.map((id) => POTIONS[id]).filter(Boolean);

  function closeDeck() {
    setDeckOpen(false);
    window.setTimeout(() => deckButtonRef.current?.focus(), 0);
  }

  function closeSettings() {
    setSettingsOpen(false);
    window.setTimeout(() => settingsButtonRef.current?.focus(), 0);
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (settingsOpen) closeSettings();
        else if (deckOpen) closeDeck();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [settingsOpen, deckOpen]);

  function handleAbandonRun() {
    if (confirm("정말 현재 런을 포기하시겠습니까? 저장된 데이터가 모두 삭제됩니다.")) {
      const storage = typeof window !== "undefined" ? window.localStorage : null;
      if (storage) {
        clearRunSave(storage);
      }
      window.location.reload();
    }
  }

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    audioManager.setVolume(v);
    setBgmVol(v);
    if (bgmMuted && v > 0) {
      audioManager.toggleMute();
      setBgmMuted(false);
    }
  }, [bgmMuted]);

  const handleMuteToggle = useCallback(() => {
    const m = audioManager.toggleMute();
    setBgmMuted(m);
  }, []);

  const handleSfxVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    sfx.setVolume(v);
    setSfxVol(v);
    if (sfxMuted && v > 0) {
      sfx.toggleMute();
      setSfxMuted(false);
    }
  }, [sfxMuted]);

  const handleSfxMuteToggle = useCallback(() => {
    const m = sfx.toggleMute();
    setSfxMuted(m);
  }, []);

  return (
    <>
      <header className="run-topbar">
        <div className="logo">
          SLAY THE <span>MONSTARZ</span>
        </div>
        <div className="run-location">
          <span>{actTheme(run.state.act).label}</span>
          <strong>
            {actTheme(run.state.act).location}
            {run.state.ascension && run.state.ascension > 1 && (
              <span className="ascension-badge">승천 {run.state.ascension}</span>
            )}
          </strong>
        </div>
        <div className="run-stats" aria-label="현재 런 상태">
          <span>
            <span className="stat-label-full">체력</span>
            <span className="stat-label-short">HP</span>
            <strong>{run.state.hp}/{run.state.maxHp}</strong>
          </span>
          <span>
            <span className="stat-label-full">골드</span>
            <span className="stat-label-short">G</span>
            <strong>{run.state.gold}</strong>
          </span>
          <button
            ref={deckButtonRef}
            className="run-deck-trigger"
            type="button"
            aria-haspopup="dialog"
            aria-expanded={deckOpen}
            onClick={() => setDeckOpen(true)}
          >
            <span className="stat-label-full">덱 보기</span>
            <span className="stat-label-short">덱</span>
            <strong>{run.state.deck.length}</strong>
          </button>
          <button
            ref={settingsButtonRef}
            className="run-settings-trigger"
            type="button"
            aria-haspopup="dialog"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen(true)}
            aria-label="설정"
            title="설정"
          >
            ⚙️
          </button>
        </div>
        <div className="audio-controls">
          <div className="bgm-control" aria-label="BGM 음량">
            <button
              type="button"
              className={`bgm-mute-btn${bgmMuted ? " muted" : ""}`}
              onClick={handleMuteToggle}
              aria-label={bgmMuted ? "BGM 음소거 해제" : "BGM 음소거"}
              title={bgmMuted ? "BGM 음소거 해제" : "BGM 음소거"}
            >
              {bgmMuted ? "🎵🔇" : bgmVol > 0.5 ? "🎵🔊" : bgmVol > 0 ? "🎵🔉" : "🎵🔈"}
            </button>
            <input
              type="range"
              className="bgm-volume-slider"
              min="0"
              max="1"
              step="0.05"
              value={bgmMuted ? 0 : bgmVol}
              onChange={handleVolumeChange}
              aria-label="BGM 음량"
              title={`BGM ${Math.round((bgmMuted ? 0 : bgmVol) * 100)}%`}
            />
          </div>
          <div className="bgm-control" aria-label="효과음 음량">
            <button
              type="button"
              className={`bgm-mute-btn${sfxMuted ? " muted" : ""}`}
              onClick={handleSfxMuteToggle}
              aria-label={sfxMuted ? "효과음 음소거 해제" : "효과음 음소거"}
              title={sfxMuted ? "효과음 음소거 해제" : "효과음 음소거"}
            >
              {sfxMuted ? "💥🔇" : sfxVol > 0.5 ? "💥🔊" : sfxVol > 0 ? "💥🔉" : "💥🔈"}
            </button>
            <input
              type="range"
              className="bgm-volume-slider"
              min="0"
              max="1"
              step="0.05"
              value={sfxMuted ? 0 : sfxVol}
              onChange={handleSfxVolumeChange}
              aria-label="효과음 음량"
              title={`SFX ${Math.round((sfxMuted ? 0 : sfxVol) * 100)}%`}
            />
          </div>
        </div>
        {relics.length > 0 && (
          <ul className="run-relics" aria-label="보유 유물">
            {relics.map((relic) => (
              <li key={relic.id} className={`relic-chip rarity-${relic.rarity} stmz-tooltip-wrap`}>
                {getRelicIcon(relic.id)}
                <div className="stmz-tooltip">
                  <strong>{relic.name}</strong>
                  <p>{relic.description}</p>
                  {relic.flavor && <em>{relic.flavor}</em>}
                </div>
              </li>
            ))}
          </ul>
        )}
        {potions.length > 0 && (
          <ul className="run-potions" aria-label="보유 포션">
            {potions.map((potion, index) => (
              <li
                key={`${potion.id}-${index}`}
                className={`potion-chip ${potion.type} stmz-tooltip-wrap`}
              >
                {getPotionIcon(potion.id)}
                <div className="stmz-tooltip">
                  <strong>{potion.name}</strong>
                  <p>{potion.description}</p>
                  {potion.flavor && <em>{potion.flavor}</em>}
                  <small>(전투 중 사용)</small>
                </div>
              </li>
            ))}
          </ul>
        )}
      </header>
      {deckOpen && <DeckViewer deck={run.state.deck} onClose={closeDeck} />}
      {settingsOpen && (
        <div className="settings-modal-backdrop" onClick={closeSettings}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <header className="settings-modal-header">
              <h2>설정</h2>
              <button type="button" onClick={closeSettings} aria-label="닫기">
                ✕
              </button>
            </header>
            <div className="settings-modal-content">
              <section className="settings-section">
                <h3>오디오</h3>
                <div className="settings-row">
                  <label>BGM 음량</label>
                  <div className="bgm-control">
                    <button
                      type="button"
                      className={`bgm-mute-btn${bgmMuted ? " muted" : ""}`}
                      onClick={handleMuteToggle}
                      aria-label={bgmMuted ? "BGM 음소거 해제" : "BGM 음소거"}
                      title={bgmMuted ? "BGM 음소거 해제" : "BGM 음소거"}
                    >
                      {bgmMuted ? "🎵🔇" : bgmVol > 0.5 ? "🎵🔊" : bgmVol > 0 ? "🎵🔉" : "🎵🔈"}
                    </button>
                    <input
                      type="range"
                      className="bgm-volume-slider"
                      min="0"
                      max="1"
                      step="0.05"
                      value={bgmMuted ? 0 : bgmVol}
                      onChange={handleVolumeChange}
                      aria-label="BGM 음량 조절"
                    />
                  </div>
                </div>
                <div className="settings-row">
                  <label>효과음 음량</label>
                  <div className="bgm-control">
                    <button
                      type="button"
                      className={`bgm-mute-btn${sfxMuted ? " muted" : ""}`}
                      onClick={handleSfxMuteToggle}
                      aria-label={sfxMuted ? "효과음 음소거 해제" : "효과음 음소거"}
                      title={sfxMuted ? "효과음 음소거 해제" : "효과음 음소거"}
                    >
                      {sfxMuted ? "💥🔇" : sfxVol > 0.5 ? "💥🔊" : sfxVol > 0 ? "💥🔉" : "💥🔈"}
                    </button>
                    <input
                      type="range"
                      className="bgm-volume-slider"
                      min="0"
                      max="1"
                      step="0.05"
                      value={sfxMuted ? 0 : sfxVol}
                      onChange={handleSfxVolumeChange}
                      aria-label="효과음 음량 조절"
                    />
                  </div>
                </div>
              </section>
              <section className="settings-section">
                <h3>접근성</h3>
                <div className="settings-row">
                  <label>모션 감소</label>
                  <button
                    type="button"
                    className="settings-toggle"
                    aria-pressed={document.documentElement.classList.contains("reduce-motion")}
                    onClick={() => {
                      document.documentElement.classList.toggle("reduce-motion");
                      force();
                    }}
                  >
                    {document.documentElement.classList.contains("reduce-motion") ? "ON" : "OFF"}
                  </button>
                </div>
                <div className="settings-row">
                  <label>글자 크기</label>
                  <div className="bgm-control">
                    <button type="button" onClick={() => { document.documentElement.style.fontSize = "14px"; force(); }}>작게</button>
                    <button type="button" onClick={() => { document.documentElement.style.fontSize = ""; force(); }}>기본</button>
                    <button type="button" onClick={() => { document.documentElement.style.fontSize = "18px"; force(); }}>크게</button>
                  </div>
                </div>
              </section>
              <section className="settings-section">
                <h3>게임 진행</h3>
                <button type="button" className="abandon-run-btn" onClick={handleAbandonRun}>
                  ⚠️ 런 포기 및 시작 화면으로
                </button>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function DeckViewer({ deck, onClose }: { deck: readonly string[]; onClose: () => void }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const view = buildDeckView(deck, battleContent.cards);

  useEffect(() => {
    closeButtonRef.current?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="deck-viewer-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="deck-viewer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="deck-viewer-title"
        onKeyDown={(event) => {
          if (event.key === "Tab") {
            event.preventDefault();
            closeButtonRef.current?.focus();
          }
        }}
      >
        <header className="deck-viewer-header">
          <div>
            <span>RUN LOADOUT</span>
            <h2 id="deck-viewer-title">현재 덱</h2>
            <p>강화와 소멸 여부까지 확인하고 다음 경로를 결정하세요.</p>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="덱 보기 닫기">
            닫기 <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="deck-summary" aria-label="덱 구성 요약">
          <span><small>전체</small><strong>{view.total}</strong></span>
          <span><small>카드 종류</small><strong>{view.unique}</strong></span>
          <span><small>공격 / 스킬</small><strong>{view.attacks} / {view.skills}</strong></span>
          <span className="upgraded"><small>강화</small><strong>{view.upgraded}</strong></span>
          <span className="exhaust"><small>소멸</small><strong>{view.exhaust}</strong></span>
        </div>

        <div className="deck-card-list" aria-label="현재 덱 카드">
          {view.cards.map(({ card, count, upgraded }) => (
            <article
              key={card.id}
              className={`deck-card-row ${card.type} rarity-${card.rarity}${upgraded ? " upgraded" : ""}${card.signatureFor ? " signature" : ""}`}
            >
              <span className="deck-card-cost" aria-label={`비용 ${card.cost}`}>{card.cost}</span>
              <div className="deck-card-copy">
                <div className="deck-card-name">
                  <strong>{card.name}</strong>
                  <span className={`deck-rarity rarity-${card.rarity}`}>
                    {CARD_RARITY_LABEL[card.rarity]}
                  </span>
                  {card.signatureFor && <span className="deck-tag signature">시그니처</span>}
                  {upgraded && <span className="deck-tag upgraded">강화</span>}
                  {card.exhaust && <span className="deck-tag exhaust">소멸</span>}
                </div>
                <p>{card.description}</p>
              </div>
              <span className="deck-card-count" aria-label={`${count}장`}>×{count}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function MapScreen({
  run,
  notice,
  onStartNode,
  style,
}: RunViewProps & {
  notice: string;
  onStartNode: (nodeId: string) => void;
}) {
  const available = new Set(run.state.availableNodeIds);
  const completed = new Set(run.state.completedNodeIds);
  const floorCount = Math.max(...run.nodes.map((node) => node.floor));

  function stateFor(nodeId: string) {
    if (completed.has(nodeId)) return "completed";
    if (available.has(nodeId)) return "available";
    return "locked";
  }

  return (
    <div className="run-shell map-shell" style={style}>
      <RunHeader run={run} />
      <main className="map-layout">
        <section className="map-intro">
          <span className="run-kicker">다음 경로를 선택하세요</span>
          <h1>{actTheme(run.state.act).mapTitle}</h1>
          <p>
            전투에서 잃은 체력은 다음 노드까지 이어집니다. 빛나는 노드 중 하나를
            선택해 올라가세요.
          </p>
          <div className="map-progress">
            <strong>{run.state.completedNodeIds.length}</strong>
            <span>{floorCount}개 층 중 완료</span>
          </div>
          {notice && <div className="run-notice">{notice}</div>}
        </section>

        <section className="route-panel" aria-label={`${actTheme(run.state.act).label} 분기 지도`}>
          <div className="route-board">
            <svg
              className="route-lines"
              viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
              aria-hidden="true"
            >
              {run.nodes.flatMap((node) =>
                node.nextIds.map((nextId) => {
                  const next = run.getNode(nextId);
                  const from = nodePosition(node, floorCount);
                  const to = nodePosition(next, floorCount);
                  const edgeState =
                    completed.has(node.id) && completed.has(next.id)
                      ? "completed"
                      : completed.has(node.id) && available.has(next.id)
                        ? "available"
                        : "locked";
                  return (
                    <line
                      key={`${node.id}-${nextId}`}
                      className={`route-line ${edgeState}`}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                    />
                  );
                }),
              )}
            </svg>

            {Array.from({ length: floorCount }, (_, index) => {
              const floor = index + 1;
              const y = floorPositionY(floor, floorCount);
              return (
                <span
                  className="floor-label"
                  key={floor}
                  style={{ top: `${(y / MAP_HEIGHT) * 100}%` }}
                >
                  {floor}층
                </span>
              );
            })}

            {run.nodes.map((node) => {
              const position = nodePosition(node, floorCount);
              const nodeState = stateFor(node.id);
              return (
                <div
                  className={`map-node-wrap ${nodeState}`}
                  key={node.id}
                  style={{
                    left: `${(position.x / MAP_WIDTH) * 100}%`,
                    top: `${(position.y / MAP_HEIGHT) * 100}%`,
                  }}
                >
                  <button
                    className={`map-node ${node.type}`}
                    type="button"
                    disabled={nodeState !== "available"}
                    aria-label={`${node.floor}층 ${node.title}, ${node.subtitle}`}
                    onClick={() => onStartNode(node.id)}
                  >
                    <span>{NODE_LABEL[node.type] ?? "전투"}</span>
                  </button>
                  <strong>{node.title}</strong>
                  <small>{node.subtitle}</small>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

function RewardScreen({
  run,
  notice,
  onChoose,
  onTakePotion,
  style,
}: RunViewProps & {
  notice: string;
  onChoose: (cardId: string | null) => void;
  onTakePotion: () => void;
}) {
  const reward = run.state.reward;
  if (!reward) return null;
  const source = run.getNode(reward.sourceNodeId);
  const potion = reward.potionId ? POTIONS[reward.potionId] : undefined;
  const potionsFull = run.state.potions.length >= MAX_POTIONS;

  return (
    <div className="run-shell reward-shell" style={style}>
      <RunHeader run={run} />
      <main className="reward-layout">
        <div className="reward-heading">
          <span className="run-kicker">{source.title} 돌파</span>
          <h1>한 장을 덱에 추가하세요</h1>
          <p>이번 런 동안 선택한 카드는 다음 전투부터 손패에 등장합니다.</p>
          {reward.gold > 0 && <div className="reward-gold">골드 +{reward.gold} 획득</div>}
          {reward.relicId && (
            <div className={`reward-relic rarity-${RELICS[reward.relicId].rarity}`}>
              <span className="reward-relic-label">유물 확정</span>
              <strong>{RELICS[reward.relicId].name}</strong>
              <span>{RELICS[reward.relicId].description}</span>
            </div>
          )}
          {potion && (
            <div className={`reward-potion ${potion.type}`}>
              <div className="reward-potion-info">
                <span className="reward-potion-label">포션 발견</span>
                <strong>{potion.name}</strong>
                <span>{potion.description}</span>
              </div>
              <button
                className="reward-potion-take"
                type="button"
                disabled={potionsFull}
                onClick={onTakePotion}
              >
                {potionsFull ? "슬롯 가득 참" : "받기"}
              </button>
            </div>
          )}
        </div>
        <div className="reward-cards" aria-label="카드 보상 선택">
          {reward.cardIds.map((cardId, index) => {
            const card = battleContent.cards[cardId];
            return (
              <RewardCard
                card={card}
                index={index}
                key={card.id}
                onChoose={() => onChoose(card.id)}
              />
            );
          })}
        </div>
        <button className="skip-reward" type="button" onClick={() => onChoose(null)}>
          보상 건너뛰기
        </button>
        {notice && <div className="run-notice">{notice}</div>}
      </main>
    </div>
  );
}

function RewardCard({
  card,
  index,
  onChoose,
}: {
  card: CardDef;
  index: number;
  onChoose: () => void;
}) {
  const art = cardArtUrl(card.id);
  return (
    <button
      className={`reward-card ${card.type}`}
      style={{ "--reward-index": index } as CSSProperties}
      type="button"
      onClick={onChoose}
      aria-label={`${card.name}, ${card.description}, 덱에 추가`}
    >
      <span className="reward-cost">{card.cost}</span>
      <div className="reward-art">{art && <img src={art} alt="" />}</div>
      <div className="reward-body">
        <span className="reward-type">{card.type === "attack" ? "공격" : "스킬"}</span>
        <strong>{card.name}</strong>
        <span className="reward-rule" />
        <p>{card.description}</p>
        <span className="reward-action">덱에 추가</span>
      </div>
    </button>
  );
}

function RestScreen({
  run,
  notice,
  onHeal,
  onUpgrade,
  style,
}: RunViewProps & {
  notice: string;
  onHeal: () => void;
  onUpgrade: (cardId: string) => void;
}) {
  const [mode, setMode] = useState<"choose" | "upgrade">("choose");
  const [upgradePage, setUpgradePage] = useState(0);
  const node = run.currentNode;
  const healAmount = run.restHealAmount();
  const healedHp = Math.min(run.state.maxHp, run.state.hp + healAmount);
  const upgradeable = run.upgradeableCards();
  const upgradePageSize = 9;
  const upgradePageCount = Math.max(1, Math.ceil(upgradeable.length / upgradePageSize));
  const activeUpgradePage = Math.min(upgradePage, upgradePageCount - 1);
  const visibleUpgradeable = upgradeable.slice(
    activeUpgradePage * upgradePageSize,
    (activeUpgradePage + 1) * upgradePageSize,
  );

  return (
    <div className="run-shell rest-shell" style={style}>
      <RunHeader run={run} />
      <main className="rest-layout">
        <div className="rest-heading">
          <span className="run-kicker">{node?.title ?? "야영지"}</span>
          <h1>잠시 숨을 고릅니다</h1>
          <p>체력을 회복하거나 카드 한 장을 강화해 다음 전투를 대비하세요. 하나만 선택할 수 있습니다.</p>
        </div>

        {mode === "choose" ? (
          <div className="rest-options">
            <button className="rest-option heal" type="button" onClick={onHeal}>
              <strong>휴식</strong>
              <span>체력 {healAmount} 회복</span>
              <small>
                {run.state.hp}/{run.state.maxHp} → {healedHp}/{run.state.maxHp}
              </small>
            </button>
            <button
              className="rest-option upgrade"
              type="button"
              disabled={upgradeable.length === 0}
              onClick={() => {
                setUpgradePage(0);
                setMode("upgrade");
              }}
            >
              <strong>단련</strong>
              <span>카드 한 장 강화</span>
              <small>{upgradeable.length > 0 ? `강화 가능 ${upgradeable.length}종` : "강화할 카드 없음"}</small>
            </button>
          </div>
        ) : (
          <div className="rest-upgrade">
            <div className="rest-upgrade-toolbar">
              <div>
                <span className="run-kicker">단련 목록</span>
                <strong>강화할 카드 선택</strong>
              </div>
              <span aria-live="polite">
                {activeUpgradePage + 1} / {upgradePageCount} 페이지
              </span>
            </div>
            <div
              className="reward-cards rest-upgrade-grid"
              aria-label={`강화할 카드 선택, ${activeUpgradePage + 1}페이지`}
            >
              {visibleUpgradeable.map((cardId, index) => {
                const card = battleContent.cards[cardId];
                const upgraded = battleContent.cards[`${cardId}+`];
                const art = cardArtUrl(cardId);
                return (
                  <button
                    className={`reward-card ${card.type}${card.signatureFor ? " signature" : ""}`}
                    style={{ "--reward-index": index } as CSSProperties}
                    key={cardId}
                    type="button"
                    onClick={() => onUpgrade(cardId)}
                    aria-label={`${card.name}을 ${upgraded.name}으로 강화`}
                  >
                    <span className="reward-cost">{upgraded.cost}</span>
                    <div className="reward-art">{art && <img src={art} alt="" />}</div>
                    <div className="reward-body">
                      <span className="reward-type">
                        {card.type === "attack" ? "공격" : "스킬"}
                        {card.signatureFor ? " · 시그니처" : ""}
                      </span>
                      <strong>{upgraded.name}</strong>
                      <span className="reward-rule" />
                      <p>{card.description} → {upgraded.description}</p>
                      <span className="reward-action">강화</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="rest-upgrade-pagination" aria-label="강화 카드 페이지 이동">
              <button
                type="button"
                disabled={activeUpgradePage === 0}
                onClick={() => setUpgradePage((page) => Math.max(0, page - 1))}
              >
                이전 9장
              </button>
              <span>{upgradeable.length}종 중 {activeUpgradePage * upgradePageSize + 1}–{Math.min((activeUpgradePage + 1) * upgradePageSize, upgradeable.length)}</span>
              <button
                type="button"
                disabled={activeUpgradePage >= upgradePageCount - 1}
                onClick={() => setUpgradePage((page) => Math.min(upgradePageCount - 1, page + 1))}
              >
                다음 9장
              </button>
            </div>
            <button
              className="skip-reward"
              type="button"
              onClick={() => {
                setUpgradePage(0);
                setMode("choose");
              }}
            >
              뒤로
            </button>
          </div>
        )}
        {notice && <div className="run-notice">{notice}</div>}
      </main>
    </div>
  );
}

function EventScreen({
  run,
  notice,
  onChoose,
  style,
}: RunViewProps & {
  notice: string;
  onChoose: (choiceId: string) => void;
}) {
  const event = run.currentEvent();
  if (!event) return null;

  return (
    <div className="run-shell event-shell" style={style}>
      <RunHeader run={run} />
      <main className="event-layout">
        <div className="event-heading">
          <span className="run-kicker">{event.subtitle}</span>
          <h1>{event.title}</h1>
          <p>{event.body}</p>
        </div>
        <div className="event-choices" aria-label="이벤트 선택지">
          {event.choices.map((choice) => (
            <button
              className="event-choice"
              key={choice.id}
              type="button"
              onClick={() => onChoose(choice.id)}
              aria-label={`${choice.label}, ${choice.description}`}
            >
              <strong>{choice.label}</strong>
              <span>{choice.description}</span>
            </button>
          ))}
        </div>
        {notice && <div className="run-notice">{notice}</div>}
      </main>
    </div>
  );
}

const CARD_RARITY_LABEL = {
  common: "일반",
  uncommon: "고급",
  rare: "희귀",
} as const;

const RELIC_RARITY_LABEL: Record<string, string> = {
  starter: "고유",
  common: "일반",
  uncommon: "고급",
  rare: "희귀",
};

function ShopScreen({
  run,
  notice,
  onBuy,
  onBuyRelic,
  onBuyPotion,
  onRemove,
  onLeave,
  style,
}: RunViewProps & {
  notice: string;
  onBuy: (itemId: string) => void;
  onBuyRelic: (itemId: string) => void;
  onBuyPotion: (itemId: string) => void;
  onRemove: (cardId: string) => void;
  onLeave: () => void;
}) {
  const [mode, setMode] = useState<"browse" | "remove">("browse");
  const shop = run.currentShop();
  if (!shop) return null;

  const deckGroups = Array.from(
    run.state.deck.reduce((map, cardId) => map.set(cardId, (map.get(cardId) ?? 0) + 1), new Map<string, number>()),
  );
  const canRemove = !shop.removalUsed && run.state.gold >= shop.removalPrice;
  const relicItems = shop.relicItems ?? [];
  const potionItems = shop.potionItems ?? [];
  const potionSlotsFull = run.state.potions.length >= MAX_POTIONS;

  return (
    <div className="run-shell shop-shell" style={style}>
      <RunHeader run={run} />
      <main className="shop-layout">
        <div className="shop-heading">
          <span className="run-kicker">상점 · 보유 골드 {run.state.gold}</span>
          <h1>잔해 시장</h1>
          <p>카드와 유물, 포션을 구매하거나 카드 한 장을 제거할 수 있습니다. 끝나면 떠나기를 누르세요.</p>
        </div>

        {mode === "browse" ? (
          <>
            <section className="shop-section">
              <div className="shop-section-heading">
                <strong>카드</strong>
                <span>4종</span>
              </div>
              <div className="reward-cards shop-card-grid" aria-label="구매 가능한 카드">
                {shop.items.map((item, index) => {
                  const card = battleContent.cards[item.cardId];
                  const affordable = !item.sold && run.state.gold >= item.price;
                  const art = cardArtUrl(card.id);
                  return (
                    <button
                      className={`reward-card ${card.type}${item.sold ? " sold" : ""}`}
                      style={{ "--reward-index": index } as CSSProperties}
                      key={item.id}
                      type="button"
                      disabled={!affordable}
                      onClick={() => onBuy(item.id)}
                      aria-label={`${card.name}, ${CARD_RARITY_LABEL[card.rarity]}, ${card.description}, 가격 ${item.price} 골드`}
                    >
                      <span className="reward-cost">{card.cost}</span>
                      <div className="reward-art">{art && <img src={art} alt="" />}</div>
                      <div className="reward-body">
                        <span className="reward-type">{card.type === "attack" ? "공격" : "스킬"}</span>
                        <span className={`shop-card-rarity rarity-${card.rarity}`}>
                          {CARD_RARITY_LABEL[card.rarity]}
                        </span>
                        <strong>{card.name}</strong>
                        <span className="reward-rule" />
                        <p>{card.description}</p>
                        <span className="reward-action">{item.sold ? "판매됨" : `${item.price} 골드`}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="shop-section">
              <div className="shop-section-heading">
                <strong>유물</strong>
                <span>미보유 {relicItems.length}종</span>
              </div>
              <div className="shop-offers" aria-label="구매 가능한 유물">
                {relicItems.map((item) => {
                  const relic = RELICS[item.relicId];
                  const owned = run.hasRelic(item.relicId);
                  const affordable = !item.sold && !owned && run.state.gold >= item.price;
                  return (
                    <button
                      className={`shop-offer relic rarity-${relic.rarity}${item.sold ? " sold" : ""}`}
                      key={item.id}
                      type="button"
                      disabled={!affordable}
                      onClick={() => onBuyRelic(item.id)}
                      aria-label={`${relic.name}, ${RELIC_RARITY_LABEL[relic.rarity]}, ${relic.description}, 가격 ${item.price} 골드`}
                    >
                      <span className="shop-offer-kind">
                        유물 · {RELIC_RARITY_LABEL[relic.rarity]}
                      </span>
                      <strong>{relic.name}</strong>
                      <p>{relic.description}</p>
                      <span className="shop-offer-price">
                        {item.sold ? "판매됨" : owned ? "보유 중" : `${item.price} 골드`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="shop-section">
              <div className="shop-section-heading">
                <strong>포션</strong>
                <span>{run.state.potions.length}/{MAX_POTIONS} 슬롯</span>
              </div>
              <div className="shop-offers potions" aria-label="구매 가능한 포션">
                {potionItems.map((item) => {
                  const potion = POTIONS[item.potionId];
                  const affordable =
                    !item.sold && !potionSlotsFull && run.state.gold >= item.price;
                  return (
                    <button
                      className={`shop-offer potion ${potion.type}${item.sold ? " sold" : ""}`}
                      key={item.id}
                      type="button"
                      disabled={!affordable}
                      onClick={() => onBuyPotion(item.id)}
                      aria-label={`${potion.name}, ${potion.description}, 가격 ${item.price} 골드`}
                    >
                      <span className="shop-offer-kind">
                        {potion.type === "attack" ? "🔥 공격 포션" : "✦ 스킬 포션"}
                      </span>
                      <strong>{potion.name}</strong>
                      <p>{potion.description}</p>
                      <span className="shop-offer-price">
                        {item.sold ? "판매됨" : potionSlotsFull ? "슬롯 가득 참" : `${item.price} 골드`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
            <div className="shop-actions">
              <button
                className="shop-remove-toggle"
                type="button"
                disabled={!canRemove}
                onClick={() => setMode("remove")}
              >
                카드 제거 ({shop.removalPrice} 골드)
                {shop.removalUsed ? " · 사용함" : run.state.gold < shop.removalPrice ? " · 골드 부족" : ""}
              </button>
              <button className="skip-reward" type="button" onClick={onLeave}>
                떠나기
              </button>
            </div>
          </>
        ) : (
          <div className="shop-remove">
            <p className="shop-remove-hint">제거할 카드를 선택하세요 (골드 {shop.removalPrice} 소비)</p>
            <div className="shop-remove-list" aria-label="제거할 카드 선택">
              {deckGroups.map(([cardId, count]) => {
                const card = battleContent.cards[cardId];
                return (
                  <button
                    className="shop-remove-card"
                    key={cardId}
                    type="button"
                    onClick={() => {
                      onRemove(cardId);
                      setMode("browse");
                    }}
                    aria-label={`${card?.name ?? cardId} 제거`}
                  >
                    <strong>{card?.name ?? cardId}</strong>
                    {count > 1 && <span>×{count}</span>}
                  </button>
                );
              })}
            </div>
            <button className="skip-reward" type="button" onClick={() => setMode("browse")}>
              뒤로
            </button>
          </div>
        )}
        {notice && <div className="run-notice">{notice}</div>}
      </main>
    </div>
  );
}

function TreasureScreen({
  run,
  notice,
  onChoose,
  style,
}: RunViewProps & {
  notice: string;
  onChoose: (relicId: string | null) => void;
}) {
  const treasure = run.currentTreasure();
  if (!treasure) return null;
  const source = run.getNode(treasure.sourceNodeId);

  return (
    <div className="run-shell treasure-shell" style={style}>
      <RunHeader run={run} />
      <main className="treasure-layout">
        <div className="treasure-heading">
          <span className="run-kicker">{source.title}</span>
          <h1>유물을 하나 선택하세요</h1>
          <p>선택한 유물은 남은 런 내내 효과를 발휘합니다. 필요 없으면 건너뛸 수 있습니다.</p>
        </div>
        <div className="treasure-relics" aria-label="유물 보상 선택">
          {treasure.relicIds.map((relicId, index) => {
            const relic = RELICS[relicId];
            return (
              <button
                className={`treasure-relic rarity-${relic.rarity}`}
                style={{ "--relic-index": index } as CSSProperties}
                key={relic.id}
                type="button"
                onClick={() => onChoose(relic.id)}
                aria-label={`${relic.name}, ${relic.description}, 획득`}
              >
                <span className={`relic-rarity rarity-${relic.rarity}`}>
                  {RELIC_RARITY_LABEL[relic.rarity] ?? relic.rarity}
                </span>
                <strong>{relic.name}</strong>
                <span className="treasure-rule" />
                <p>{relic.description}</p>
                {relic.flavor && <small>{relic.flavor}</small>}
                <span className="treasure-action">획득</span>
              </button>
            );
          })}
        </div>
        <button className="skip-reward" type="button" onClick={() => onChoose(null)}>
          건너뛰기
        </button>
        {notice && <div className="run-notice">{notice}</div>}
      </main>
    </div>
  );
}

function BossRewardScreen({
  run,
  onChoose,
  style,
}: RunViewProps & { onChoose: (cardId: string | null, relicId: string | null) => void }) {
  const bossReward = run.currentBossReward();
  const [cardSel, setCardSel] = useState<string | null>(null);
  const [relicSel, setRelicSel] = useState<string | null>(null);
  if (!bossReward) return null;

  return (
    <div className="run-shell treasure-shell" style={style}>
      <RunHeader run={run} />
      <main className="treasure-layout">
        <div className="treasure-heading">
          <span className="run-kicker">보스 처치 보상</span>
          <h1>보상을 선택하세요</h1>
          <p>카드 1장과 유물 1개를 각각 선택할 수 있습니다. 필요 없으면 건너뛰기 가능.</p>
        </div>

        <h2 className="boss-reward-section-title">카드 (1장 선택)</h2>
        <div className="boss-reward-cards">
          {bossReward.cardIds.map((cardId) => {
            const card = battleContent.cards[cardId];
            if (!card) return null;
            const selected = cardSel === cardId;
            return (
              <button
                className={`reward-card-option rarity-${card.rarity}${selected ? " selected" : ""}`}
                key={cardId}
                type="button"
                onClick={() => setCardSel(selected ? null : cardId)}
              >
                <strong>{card.name}</strong>
                <span className={`card-rarity-badge rarity-${card.rarity}`}>
                  {CARD_RARITY_LABEL[card.rarity] ?? card.rarity}
                </span>
                <p>{card.description}</p>
              </button>
            );
          })}
        </div>

        <h2 className="boss-reward-section-title">유물 (1개 선택)</h2>
        <div className="treasure-relics">
          {bossReward.relicIds.map((relicId) => {
            const relic = RELICS[relicId];
            if (!relic) return null;
            const selected = relicSel === relicId;
            return (
              <button
                className={`treasure-relic rarity-${relic.rarity}${selected ? " selected" : ""}`}
                key={relic.id}
                type="button"
                onClick={() => setRelicSel(selected ? null : relic.id)}
              >
                <span className={`relic-rarity rarity-${relic.rarity}`}>
                  {RELIC_RARITY_LABEL[relic.rarity] ?? relic.rarity}
                </span>
                <strong>{relic.name}</strong>
                <p>{relic.description}</p>
                <span className="treasure-action">{selected ? "선택됨" : "선택"}</span>
              </button>
            );
          })}
        </div>

        <button
          className="start-primary"
          type="button"
          onClick={() => onChoose(cardSel, relicSel)}
        >
          {cardSel || relicSel ? "보상 확정" : "모두 건너뛰기"}
        </button>
      </main>
    </div>
  );
}

function RunResult({
  run,
  onRestart,
  style,
}: RunViewProps & { onRestart: () => void }) {
  const won = run.state.phase === "won";
  const s = run.state;
  
  useEffect(() => {
    if (won) {
      const storage = typeof window !== "undefined" ? window.localStorage : null;
      if (storage && run.state.ascension) {
        unlockNextAscension(storage, run.state.ascension);
      }
    }
  }, [won, run.state.ascension]);

  const nodesCleared = ((s.act - 1) * 10) + s.completedNodeIds.length;
  const cardsCollected = s.deck.length;
  const relicsCollected = s.relics.length;
  const totalGold = s.gold;
  
  return (
    <div className="run-shell ending-shell" style={style}>
      <RunHeader run={run} />
      <main className="ending-layout">
        <div className={`result-banner ${won ? "victory" : "defeat"}`}>
          <span className="run-kicker">{won ? "모든 막 돌파" : `${actTheme(s.act).location} · 런 종료`}</span>
          <h1>{won ? "성간 전함을 쓰러뜨렸습니다" : `${actTheme(s.act).location}에서 쓰러졌습니다`}</h1>
        </div>
        
        <div className="run-stats-grid">
          <div className="stat-box">
            <span className="stat-icon">📈</span>
            <div className="stat-info">
              <span className="stat-label">진행 층수</span>
              <strong className="stat-value">{nodesCleared}층</strong>
            </div>
          </div>
          <div className="stat-box">
            <span className="stat-icon">🃏</span>
            <div className="stat-info">
              <span className="stat-label">보유 카드</span>
              <strong className="stat-value">{cardsCollected}장</strong>
            </div>
          </div>
          <div className="stat-box">
            <span className="stat-icon">💎</span>
            <div className="stat-info">
              <span className="stat-label">수집 유물</span>
              <strong className="stat-value">{relicsCollected}개</strong>
            </div>
          </div>
          <div className="stat-box">
            <span className="stat-icon">💰</span>
            <div className="stat-info">
              <span className="stat-label">최종 골드</span>
              <strong className="stat-value">{totalGold}G</strong>
            </div>
          </div>
        </div>
        
        <button type="button" className="restart-btn" onClick={onRestart}>
          메인 메뉴로
        </button>
      </main>
    </div>
  );
}
