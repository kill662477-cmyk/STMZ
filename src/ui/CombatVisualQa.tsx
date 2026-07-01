import { useEffect, useRef, useState } from "react";
import { battleContent } from "../content/battleContent";
import { BattleStage } from "../game/pixi/BattleStage";

const ENEMY_ACT: Record<string, number> = {
  sentinel_scout: 1,
  wasteland_gunner: 1,
  acid_stalker: 1,
  elite_sentinel: 1,
  brood_queen: 1,
  void_stalker: 2,
  siege_marauder: 2,
  chitin_brute: 2,
  resonance_warden: 2,
  abyssal_charger: 2,
  interceptor: 3,
  fire_support: 3,
  abyssal_cluster: 3,
  battleship_escort: 3,
  interstellar_battleship: 3,
};

const characterIds = Object.keys(battleContent.characters);
const enemyIds = Object.keys(battleContent.enemies);

function initialId(param: string, ids: string[], fallback: string): string {
  const value = new URLSearchParams(window.location.search).get(param);
  return value && ids.includes(value) ? value : fallback;
}

export function CombatVisualQa() {
  const mountRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<BattleStage | null>(null);
  const [characterId, setCharacterId] = useState(() =>
    initialId("character", characterIds, "ample"),
  );
  const [enemyId, setEnemyId] = useState(() =>
    initialId("enemy", enemyIds, "wasteland_gunner"),
  );
  const [busy, setBusy] = useState(false);
  const character = battleContent.characters[characterId];
  const enemy = battleContent.enemies[enemyId];
  const act = ENEMY_ACT[enemyId] ?? 1;

  useEffect(() => {
    const stage = new BattleStage();
    let active = true;
    stage
      .init(mountRef.current!, {
        playerTexture: character.texture,
        playerRace: character.race,
        enemyTexture: enemy.texture,
        isBoss: enemy.tier === "boss",
        act,
      })
      .then(() => {
        if (!active) stage.destroy();
        else stageRef.current = stage;
      });

    return () => {
      active = false;
      if (stageRef.current === stage) {
        stageRef.current.destroy();
        stageRef.current = null;
      }
    };
  }, [act, character.race, character.texture, enemy.texture, enemy.tier]);

  async function preview(action: (stage: BattleStage) => Promise<void>) {
    const stage = stageRef.current;
    if (!stage || busy) return;
    setBusy(true);
    await action(stage);
    setBusy(false);
  }

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: "#05080c",
        color: "#f4ecd8",
      }}
    >
      <div
        ref={mountRef}
        data-testid="combat-qa-stage"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100vw",
          height: "56.25vw",
          maxHeight: "100vh",
        }}
      />

      <section
        aria-label="전투 비주얼 QA 조작부"
        style={{
          position: "absolute",
          zIndex: 2,
          top: 16,
          left: 16,
          display: "flex",
          gap: 10,
          alignItems: "center",
          padding: "10px 12px",
          border: "1px solid rgba(101,234,255,.5)",
          borderRadius: 10,
          background: "rgba(5,8,12,.88)",
          boxShadow: "0 8px 30px rgba(0,0,0,.45)",
        }}
      >
        <strong style={{ color: "#65eaff" }}>COMBAT QA</strong>
        <label>
          캐릭터{" "}
          <select
            aria-label="QA 캐릭터"
            value={characterId}
            onChange={(event) => setCharacterId(event.target.value)}
          >
            {characterIds.map((id) => (
              <option key={id} value={id}>
                {battleContent.characters[id].name} · {id}
              </option>
            ))}
          </select>
        </label>
        <label>
          적{" "}
          <select
            aria-label="QA 적"
            value={enemyId}
            onChange={(event) => setEnemyId(event.target.value)}
          >
            {enemyIds.map((id) => (
              <option key={id} value={id}>
                {ENEMY_ACT[id] ?? 1}막 · {battleContent.enemies[id].name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => preview((stage) => stage.playerAttack([8]))}
        >
          플레이어 공격
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => preview((stage) => stage.enemyAttack([8]))}
        >
          적 공격
        </button>
      </section>

      <aside
        style={{
          position: "absolute",
          zIndex: 2,
          left: 16,
          bottom: 16,
          padding: "8px 11px",
          borderRadius: 8,
          background: "rgba(5,8,12,.78)",
          fontSize: 13,
          color: "#b9c4c9",
        }}
      >
        {character.name} ({character.race}) · {act}막 {enemy.name} ·{" "}
        {enemy.tier}
      </aside>
    </main>
  );
}
