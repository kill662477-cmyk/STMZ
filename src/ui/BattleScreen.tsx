import { useEffect, useReducer, useRef, useState } from "react";
import { battleContent } from "../content/battleContent";
import { cardArtUrl } from "../content/cardArt";
import { POTIONS } from "../content/potions";
import { RELICS } from "../content/relics";
import { sfx } from "../game/audio/SfxManager";
import { BattleEngine, type BattleEvent } from "../game/engine/BattleEngine";
import type { CardInstance, StatusMap } from "../game/engine/types";
import { BattleStage } from "../game/pixi/BattleStage";

const STATUS_LABEL: Record<string, string> = { vulnerable: "취약", weak: "약화", strength: "힘", poison: "중독", regen: "재생", stun: "기절" };
type PotionFeedback = Extract<BattleEvent, { type: "potion" }> & { id: number };

function potionFeedbackText(event: Extract<BattleEvent, { type: "potion" }>): string {
  if (event.effect === "energy") return `에너지 +${event.amount}`;
  if (event.effect === "draw") return event.amount > 0 ? `카드 ${event.amount}장 뽑기` : "뽑을 카드 없음";
  return event.amount > 0 ? `체력 +${event.amount}` : "체력 최대";
}

function statusChips(statuses: StatusMap) {
  return Object.entries(statuses)
    .filter(([, v]) => (v ?? 0) > 0)
    .map(([k, v]) => (
      <span key={k} className={`chip ${k}`}>
        {STATUS_LABEL[k] ?? k} {v}
      </span>
    ));
}

export function BattleScreen({
  engine,
  floor,
  nodeTitle,
  act,
  potions,
  relics,
  onUsePotion,
  onResolve,
  onOpenDeck,
  onOpenMap,
}: {
  engine: BattleEngine;
  floor: number;
  nodeTitle: string;
  act: number;
  potions: { slot: number; id: string }[];
  relics: string[];
  onUsePotion: (slot: number) => BattleEvent[];
  onResolve: () => void;
  onOpenDeck: () => void;
  onOpenMap: () => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<BattleStage | null>(null);
  const busyRef = useRef(false);
  const [, force] = useReducer((x) => x + 1, 0);
  const [message, setMessage] = useState("");
  const [potionFeedback, setPotionFeedback] = useState<PotionFeedback | null>(null);
  const potionFeedbackTimerRef = useRef<number | null>(null);
  const [showBossWarning, setShowBossWarning] = useState(false);
  const bossIntroPlayedRef = useRef(false);
  const [initError, setInitError] = useState<string | null>(null);
  const encounterKey = engine.state.enemies.map((enemy) => enemy.definitionId).join(",");

  useEffect(() => {
    setMessage("");
    setPotionFeedback(null);
    setInitError(null);
    const defs = engine.state.enemies.map(
      (enemy) => battleContent.enemies[enemy.definitionId],
    );
    const character = battleContent.characters[engine.state.player.id];
    const stage = new BattleStage();
    let active = true;
    stage
      .init(mountRef.current!, {
        playerTexture: character.texture,
        playerRace: character.race,
        enemyTextures: defs.map((def) => def.texture),
        isBosses: defs.map((def) => def.tier === "boss"),
        act,
      })
      .then(() => {
        if (!active) stage.destroy();
        else stageRef.current = stage;
      })
      .catch((err) => {
        console.error("PIXI Init Error:", err);
        if (active) setInitError(err.message || String(err));
      });
    return () => {
      active = false;
      if (stageRef.current) {
        stageRef.current.destroy();
        stageRef.current = null;
      }
      if (potionFeedbackTimerRef.current !== null) {
        window.clearTimeout(potionFeedbackTimerRef.current);
        potionFeedbackTimerRef.current = null;
      }
    };
  }, [act, encounterKey, engine]);

  function showPotionFeedback(event: Extract<BattleEvent, { type: "potion" }>) {
    if (potionFeedbackTimerRef.current !== null) {
      window.clearTimeout(potionFeedbackTimerRef.current);
    }
    setPotionFeedback({ ...event, id: Date.now() });
    potionFeedbackTimerRef.current = window.setTimeout(() => {
      setPotionFeedback(null);
      potionFeedbackTimerRef.current = null;
    }, 1100);
  }

  async function runEvents(events: BattleEvent[]) {
    const stage = stageRef.current;
    for (const e of events) {
      if (e.type === "damage") {
        if (e.source === "poison") {
          // 독 데미지는 공격 애니메이션/타격음을 재생하지 않음
          force();
          continue;
        }
        if (e.target === "enemy") {
          // 플레이어 → 적 공격 SFX
          const totalHits = e.hitAmounts.length;
          if (totalHits > 1) {
            // 다단 공격은 각 히트마다 stage 내부에서 처리하므로 첫 히트 SFX만
            sfx.hitMulti();
          } else {
            const dmg = e.hitAmounts.reduce((a, b) => a + b, 0);
            dmg >= 10 ? sfx.hitHeavy() : sfx.hitLight();
          }
          if (stage) await stage.playerAttack(e.hitAmounts, e.enemyIndex ?? 0);
        } else {
          // 적 → 플레이어 공격 SFX
          sfx.hitEnemy();
          if (stage) await stage.enemyAttack(e.hitAmounts, e.enemyIndex ?? 0);
        }
        force();
      } else if (e.type === "block") {
        sfx.block();
        if (stage) await stage.block(e.target, e.amount, e.enemyIndex ?? 0);
      } else if (e.type === "potion") {
        sfx.potionUse();
        showPotionFeedback(e);
        force();
      } else if (e.type === "defeat") {
        sfx.enemyDeath();
        if (stage) await stage.enemyDeath(e.enemyIndex);
      }
    }
  }

  async function playCard(instance: CardInstance) {
    if (busyRef.current || engine.state.phase !== "player") return;
    let events: BattleEvent[];
    try {
      events = engine.playCard(instance.instanceId);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "사용할 수 없습니다.");
      return;
    }
    sfx.cardPlay();
    setMessage("");
    busyRef.current = true;
    force();
    await runEvents(events);
    busyRef.current = false;
    force();
  }

  function handleTargetEnemy(index: number) {
    if (busyRef.current || engine.state.phase !== "player") return;
    engine.setActiveEnemy(index);
    force();
  }

  async function usePotion(slot: number) {
    if (busyRef.current || engine.state.phase !== "player") return;
    const events = onUsePotion(slot);
    if (events.length === 0) return;
    setMessage("");
    busyRef.current = true;
    force();
    await runEvents(events);
    busyRef.current = false;
    force();
  }

  async function endTurn() {
    if (busyRef.current || engine.state.phase !== "player") return;
    sfx.endTurn();
    busyRef.current = true;
    force();
    const events = engine.endPlayerTurn();
    await runEvents(events);
    busyRef.current = false;
    force();
  }

  const s = engine.state;

  // 상태이상(VFX) 동기화
  useEffect(() => {
    if (stageRef.current) {
      stageRef.current.syncStatuses(s.player.statuses, s.enemies.map(e => e.statuses));
    }
  }, [s, s.player.statuses, s.enemies]);
  const enemyDefs = s.enemies.map((enemy) => battleContent.enemies[enemy.definitionId]);
  const bossBattle = enemyDefs.some((enemy) => enemy.tier === "boss");
  const busy = busyRef.current;
  const ended = s.phase === "won" || s.phase === "lost";

  useEffect(() => {
    if (bossBattle && !bossIntroPlayedRef.current) {
      bossIntroPlayedRef.current = true;
      setShowBossWarning(true);
      sfx.bossEntrance();
      const t = setTimeout(() => setShowBossWarning(false), 2500);
      return () => clearTimeout(t);
    }
  }, [bossBattle]);

  // 승패 SFX — 상태 전환 시 1회
  useEffect(() => {
    if (s.phase === "won") sfx.victory();
    else if (s.phase === "lost") sfx.defeat();
  }, [s.phase]);

  return (
    <div className="stmz-root">
      <div className="topbar">
        <div className="logo">
          SLAY THE <span>MONSTARZ</span>
        </div>
        <div className="turn">TURN {s.turn}</div>
        <div className="battle-context">
          <span>{act}막 {floor}층</span>
          <strong>{nodeTitle}</strong>
        </div>
        {relics.length > 0 && (
          <ul className="run-relics" aria-label="보유 유물" style={{ marginLeft: "12px", borderLeft: "1px solid rgba(236, 227, 207, 0.14)", paddingLeft: "12px" }}>
            {relics.map((id, idx) => {
              const def = RELICS[id];
              return (
                <li key={`${id}-${idx}`} className={`relic-chip rarity-${def.rarity} stmz-tooltip-wrap`}>
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
                  <div className="stmz-tooltip bottom">
                    <strong>{def.name}</strong>
                    <p>{def.description}</p>
                    {def.flavor && <em>{def.flavor}</em>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <button type="button" className="run-deck-trigger" onClick={onOpenDeck} style={{ padding: "6px 12px", background: "rgba(0,0,0,0.5)", border: "1px solid #7a6a5a", color: "#c8b8a8", borderRadius: "6px", cursor: "pointer" }}>
            덱 보기
          </button>
          <button type="button" className="run-settings-trigger" onClick={onOpenMap} style={{ padding: "6px 12px", background: "rgba(0,0,0,0.5)", border: "1px solid #7a6a5a", color: "#c8b8a8", borderRadius: "6px", cursor: "pointer" }}>
            맵 보기
          </button>
        </div>
      </div>

      <div className="stage-wrap" style={{ position: "relative" }}>
        <div className="pixi-mount" ref={mountRef} />
        {initError && (
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.85)",
            color: "#ff4d4d",
            padding: "20px",
            textAlign: "center",
            zIndex: 99
          }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "1.2rem" }}>전투 화면 그래픽 초기화 실패</h3>
            <p style={{ margin: "0 0 15px 0", fontSize: "0.9rem", color: "#ccc", maxWidth: "80%", wordBreak: "break-all" }}>
              {initError}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "#ff4d4d",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              게임 새로고침
            </button>
          </div>
        )}
        {showBossWarning && (
          <div className="boss-warning-overlay">
            <h1>WARNING</h1>
            <p>BOSS BATTLE</p>
          </div>
        )}
        <div className="combatant player-hud">
          <div className="cname">
            {s.player.name} <em>{s.player.race}</em>
          </div>
          <Hp cur={s.player.hp} max={s.player.maxHp} />
          <div className="subrow">
            {s.player.block > 0 && <span className="block">◆ {s.player.block}</span>}
            {statusChips(s.player.statuses)}
          </div>
        </div>

        <div className={`enemy-hud-stack count-${s.enemies.length}`}>
          {s.enemies.map((enemy, enemyIndex) => {
            const enemyDef = enemyDefs[enemyIndex];
            const intent = engine.getIntent(enemyIndex);
            const intentValue =
              intent.damage !== undefined
                ? `${intent.damage}${intent.hits && intent.hits > 1 ? ` × ${intent.hits}` : ""}`
                : intent.block !== undefined
                  ? `+${intent.block}`
                  : "!";
            return (
              <div
                className={`combatant enemy-hud${enemy.hp <= 0 ? " defeated" : ""}${enemyIndex === s.activeEnemyIndex && enemy.hp > 0 ? " active-target" : ""}`}
                key={`${enemy.definitionId}-${enemyIndex}`}
                onClick={() => { if (enemy.hp > 0) handleTargetEnemy(enemyIndex); }}
                style={{ cursor: enemy.hp > 0 ? "pointer" : "default" }}
              >
                <div className="intent" data-intent={intent.intent} data-danger={intent.damage ? intent.damage >= 15 : false}>
                  <span className="ilabel">{intent.name}</span>
                  <span className="ivalue">{enemy.hp > 0 ? intentValue : "×"}</span>
                </div>
                <div className="cname">
                  {enemyDef.name}
                  {enemyDef.tier === "boss" && <em className="boss">BOSS</em>}
                  {enemyIndex === s.activeEnemyIndex && enemy.hp > 0 && s.enemies.length > 1 && (
                    <em className="target">집중</em>
                  )}
                </div>
                <Hp cur={enemy.hp} max={enemy.maxHp} boss={enemyDef.tier === "boss"} />
                <div className="subrow">
                  {enemy.block > 0 && <span className="block">◆ {enemy.block}</span>}
                  {statusChips(enemy.statuses)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="energy-orb">
          <span>{s.player.energy}</span>
          <small>/{s.player.baseEnergy}</small>
        </div>

        <div className="piles">
          뽑을 {s.player.drawPile.length} · 버린 {s.player.discardPile.length}
          {s.player.exhaustPile.length > 0 && <> · 소멸 {s.player.exhaustPile.length}</>}
        </div>

        {potionFeedback && (
          <div
            key={potionFeedback.id}
            className={`potion-feedback ${potionFeedback.effect}`}
            role="status"
            aria-live="polite"
          >
            <span>{potionFeedback.effect === "energy" ? "✦" : potionFeedback.effect === "draw" ? "↟" : "+"}</span>
            <strong>{potionFeedbackText(potionFeedback)}</strong>
          </div>
        )}

        {potions.length > 0 && (
          <div className="potion-belt" aria-label="포션">
            {potions.map(({ slot, id }) => {
              const def = POTIONS[id];
              if (!def) return null;
              return (
                <button
                  key={slot}
                  className={`potion-btn ${def.type} stmz-tooltip-wrap`}
                  type="button"
                  disabled={busy || s.phase !== "player"}
                  onClick={() => usePotion(slot)}
                  aria-label={`${def.name} 사용, ${def.description}`}
                >
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
                  <div className="stmz-tooltip tooltip-up">
                    <strong>{def.name}</strong>
                    <p>{def.description}</p>
                    {def.flavor && <em>{def.flavor}</em>}
                    <small>클릭하여 사용</small>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {message && <div className="toast">{message}</div>}

        {ended && (
          <div className="result">
            <div className={`result-card ${s.phase}`}>
              <h2>{s.phase === "won" ? "전투 승리" : "전투 패배"}</h2>
              <button onClick={onResolve}>
                {s.phase === "won"
                  ? bossBattle
                    ? "결과 보기"
                    : "카드 보상"
                  : "런 결과"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="hand-bar">
        <div className="hand">
          {s.player.hand.map((inst, i) => {
            const def = engine.getCardDef(inst);
            const playable = !busy && s.phase === "player" && s.player.energy >= def.cost;
            const n = s.player.hand.length;
            const rot = (i - (n - 1) / 2) * 4;
            const art = cardArtUrl(def.id);
            return (
              <button
                key={inst.instanceId}
                className={`card ${def.type}${def.signatureFor ? " signature" : ""} ${playable ? "" : "dim"}`}
                style={{ transform: `rotate(${rot}deg)` }}
                disabled={!playable}
                onClick={() => playCard(inst)}
              >
                <span className="cost">{def.cost}</span>
                {def.exhaust && <span className="exhaust-badge">소멸</span>}
                <div className="card-art">{art && <img src={art} alt="" />}</div>
                <div className="card-info">
                  {def.signatureFor && <span className="signature-label">시그니처</span>}
                  <span className="cardname">{def.name}</span>
                  <span className="carddesc">{def.description}</span>
                  <span className="cardtype">{def.type === "attack" ? "공격" : "스킬"}</span>
                </div>
              </button>
            );
          })}
        </div>
        <button className="endturn" disabled={busy || s.phase !== "player"} onClick={endTurn}>
          턴 종료 ›
        </button>
      </div>
    </div>
  );
}

function Hp({ cur, max, boss }: { cur: number; max: number; boss?: boolean }) {
  const pct = Math.max(0, Math.min(100, (cur / max) * 100));
  return (
    <div className={`hpbar ${boss ? "boss" : ""}`}>
      <div className="hpfill" style={{ width: `${pct}%` }} />
      <span className="hptext">
        {cur} / {max}
      </span>
    </div>
  );
}
