import type { LatencyMetrics } from "@mighty-decks/spec/adventureState";
import { Section } from "./common/Section";

interface LatencyMetricsCardProps {
  metrics: LatencyMetrics;
}

export const LatencyMetricsCard = ({
  metrics,
}: LatencyMetricsCardProps): JSX.Element => {
  return (
    <Section className="stack">
      <h3 className="text-lg font-semibold text-ink">Storyteller Latency</h3>
      <div className="flex flex-row">
        <p className="text-sm text-slate-700">Samples: {metrics.actionCount}</p>
        <p className="text-sm text-slate-700">
          Average: {metrics.averageMs.toFixed(0)} ms
        </p>
        <p className="text-sm text-slate-700">
          P90: {metrics.p90Ms.toFixed(0)} ms
        </p>
        <p className="text-xs text-slate-500">
          Updated: {new Date(metrics.updatedAtIso).toLocaleTimeString()}
        </p>
      </div>
    </Section>
  );
};
