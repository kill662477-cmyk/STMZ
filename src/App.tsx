import { RunGame } from "./ui/RunGame";
import { CombatVisualQa } from "./ui/CombatVisualQa";

export function App() {
  const isCombatQa =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get("combatQa") === "1";

  return (
    <>
      {isCombatQa ? <CombatVisualQa /> : <RunGame />}
      <div className="portrait-orientation-warning">
        <svg viewBox="0 0 24 24" width="80" height="80" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "rotate-device 2s ease-in-out infinite", marginBottom: "20px" }}>
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
        </svg>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "10px", fontWeight: "bold" }}>화면 회전 필요</h2>
        <p style={{ fontSize: "1rem", opacity: 0.8, lineHeight: 1.4 }}>
          이 게임은 가로 모드(Landscape)에 최적화되어 있습니다.<br />
          더 쾌적한 플레이를 위해 모바일 기기를 가로로 회전해 주세요.
        </p>
      </div>
    </>
  );
}
