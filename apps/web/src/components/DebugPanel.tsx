import type { SceneDebug } from "@mighty-decks/spec/adventureState";
import { Section } from "./common/Section";
import { Text } from "./common/Text";

interface DebugPanelProps {
  debug: SceneDebug;
}

export const DebugPanel = ({ debug }: DebugPanelProps): JSX.Element => {
  return (
    <Section className="stack relative paper-shadow">
      <Text as="h3" variant="h3" color="iron">
        Debug Panel
      </Text>
      <Text variant="body" color="iron-light">
        Tension: {debug.tension ?? "n/a"}
      </Text>
      <Text variant="body" color="iron-light">
        Secrets: {debug.secrets.join(", ") || "none"}
      </Text>
      <Text variant="body" color="iron-light">
        Pacing: {debug.pacingNotes.join(", ") || "none"}
      </Text>
      <Text variant="body" color="iron-light">
        Continuity warnings: {debug.continuityWarnings.join(", ") || "none"}
      </Text>
    </Section>
  );
};
