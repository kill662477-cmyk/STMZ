import { RunGame } from "./ui/RunGame";
import { CombatVisualQa } from "./ui/CombatVisualQa";

export function App() {
  const isCombatQa =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get("combatQa") === "1";

  return isCombatQa ? <CombatVisualQa /> : <RunGame />;
}
