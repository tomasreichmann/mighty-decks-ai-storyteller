import type { SceneDebug } from "@mighty-decks/spec/adventureState";
import { Section } from "./common/Section";

interface DebugPanelProps {
  debug: SceneDebug;
}

export const DebugPanel = ({ debug }: DebugPanelProps): JSX.Element => {
  return (
    <Section className="stack relative paper-shadow">
      <h3 className="text-lg font-semibold text-kac-iron">Debug Panel</h3>
      <p className="text-sm text-kac-iron-light">
        Tension: {debug.tension ?? "n/a"}
      </p>
      <p className="text-sm text-kac-iron-light">
        Secrets: {debug.secrets.join(", ") || "none"}
      </p>
      <p className="text-sm text-kac-iron-light">
        Pacing: {debug.pacingNotes.join(", ") || "none"}
      </p>
      <p className="text-sm text-kac-iron-light">
        Continuity warnings: {debug.continuityWarnings.join(", ") || "none"}
      </p>
    </Section>
  );
};
