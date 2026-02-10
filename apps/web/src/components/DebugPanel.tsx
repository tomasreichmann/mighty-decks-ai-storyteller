import type { SceneDebug } from "@mighty-decks/spec/adventureState";
import { Section } from "./common/Section";

interface DebugPanelProps {
  debug: SceneDebug;
}

export const DebugPanel = ({ debug }: DebugPanelProps): JSX.Element => {
  return (
    <Section className="stack bg-amber-50">
      <h3 className="text-lg font-semibold text-ink">Debug Panel</h3>
      <p className="text-sm text-slate-700">Tension: {debug.tension ?? "n/a"}</p>
      <p className="text-sm text-slate-700">Secrets: {debug.secrets.join(", ") || "none"}</p>
      <p className="text-sm text-slate-700">Pacing: {debug.pacingNotes.join(", ") || "none"}</p>
      <p className="text-sm text-slate-700">Continuity warnings: {debug.continuityWarnings.join(", ") || "none"}</p>
    </Section>
  );
};

