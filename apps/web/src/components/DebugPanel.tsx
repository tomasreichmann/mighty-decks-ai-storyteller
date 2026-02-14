import type {
  SceneDebug,
  ScenePublic,
} from "@mighty-decks/spec/adventureState";
import { Section } from "./common/Section";
import { Text } from "./common/Text";
import { Message } from "./common/Message";

interface DebugPanelProps {
  debug: SceneDebug;
  scene?: ScenePublic;
  showAiRequestDetails?: boolean;
}

export const DebugPanel = ({
  debug,
  scene,
  showAiRequestDetails = false,
}: DebugPanelProps): JSX.Element => {
  const recentDecisions = debug.recentDecisions.slice(-6).reverse();

  return (
    <Section className="stack relative paper-shadow gap-4">
      <Text as="h3" variant="h3" color="iron" className="mt-4 -mb-2">
        Debug Panel
      </Text>
      {scene ? (
        <Message label="Scene Control" color="cloth" className="stack gap-2">
          <Text variant="body" color="iron-light">
            Mode: {scene.mode} | Tension: {scene.tension}
          </Text>
          <Text variant="body" color="iron-light">
            Active actor: {scene.activeActorName ?? "none"}
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
          <Text variant="body" color="iron-light">
            AI requests tracked: {debug.aiRequests.length}
          </Text>
        </Message>
      ) : null}
      {showAiRequestDetails ? (
        <Message label="AI Requests" color="curse">
          <Text variant="body" color="iron-light" className="text-sm">
            {debug.aiRequests
              .slice(-8)
              .map((entry) => `${entry.agent} ${entry.status} (${entry.model})`)
              .join(" | ") || "none"}
          </Text>
        </Message>
      ) : null}
      <Message label="Decision Log" color="gold">
        {recentDecisions.length === 0 ? (
          <Text variant="body" color="iron-light" className="text-sm">
            No turn decisions captured yet.
          </Text>
        ) : (
          <div className="stack gap-2">
            {recentDecisions.map((decision) => (
              <div key={decision.decisionId}>
                <Text variant="body" color="iron-light" className="text-sm">
                  Turn {decision.turnNumber}: {decision.actorName} |{" "}
                  {decision.modeBefore} to {decision.modeAfter} |{" "}
                  {decision.tensionBefore} to {decision.tensionAfter}
                </Text>
                <Text variant="body" color="iron-light" className="text-xs">
                  goal={decision.goalStatus}, response={decision.responseMode},
                  outcomeCheck={decision.outcomeCheckTriggered ? "yes" : "no"},
                  reward={decision.rewardGranted ? "yes" : "no"}, failForward=
                  {decision.failForwardApplied ? "yes" : "no"}
                </Text>
                <Text variant="body" color="iron-light" className="text-xs">
                  {decision.reasoning.join(" | ") ||
                    "No reasoning notes recorded."}
                </Text>
              </div>
            ))}
          </div>
        )}
      </Message>
    </Section>
  );
};
