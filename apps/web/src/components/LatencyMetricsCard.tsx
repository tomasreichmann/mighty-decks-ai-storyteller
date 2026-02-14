import type { LatencyMetrics } from "@mighty-decks/spec/adventureState";
import { Section } from "./common/Section";
import { Text } from "./common/Text";
import { Message } from "./common/Message";

interface LatencyMetricsCardProps {
  metrics: LatencyMetrics;
}

export const LatencyMetricsCard = ({
  metrics,
}: LatencyMetricsCardProps): JSX.Element => {
  return (
    <Section className="stack">
      <Text as="h3" variant="h3" color="iron" className="mb-2">
        Storyteller Latency
      </Text>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Message label="Samples" color="iron">
          {metrics.actionCount}
        </Message>
        <Message label="Average" color="iron">
          {metrics.averageMs.toFixed(0)} ms
        </Message>
        <Message label="P90" color="iron">
          {metrics.p90Ms.toFixed(0)} ms
        </Message>
        <Message label="Updated" color="iron">
          {new Date(metrics.updatedAtIso).toLocaleTimeString()}
        </Message>
      </div>
    </Section>
  );
};
