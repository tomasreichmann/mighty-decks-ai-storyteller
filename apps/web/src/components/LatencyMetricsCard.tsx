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
      <h3 className="text-lg font-semibold text-kac-iron">
        Storyteller Latency
      </h3>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <p className="border-[3px] border-b-[6px] border-kac-iron bg-gradient-to-b from-[#fffdf5] to-kac-bone-light px-3 py-2 text-kac-iron shadow-[2px_2px_0_0_#121b23] outline-none transition duration-100 placeholder:text-kac-steel-dark/85 focus-visible:border-kac-gold-darker focus-visible:ring-2 focus-visible:ring-kac-gold-dark/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-[1px_1px_0_0_#121b23] font-ui">
          Samples: {metrics.actionCount}
        </p>
        <p className="border-[3px] border-b-[6px] border-kac-iron bg-gradient-to-b from-[#fffdf5] to-kac-bone-light px-3 py-2 text-kac-iron shadow-[2px_2px_0_0_#121b23] outline-none transition duration-100 placeholder:text-kac-steel-dark/85 focus-visible:border-kac-gold-darker focus-visible:ring-2 focus-visible:ring-kac-gold-dark/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-[1px_1px_0_0_#121b23] font-ui">
          Average: {metrics.averageMs.toFixed(0)} ms
        </p>
        <p className="border-[3px] border-b-[6px] border-kac-iron bg-gradient-to-b from-[#fffdf5] to-kac-bone-light px-3 py-2 text-kac-iron shadow-[2px_2px_0_0_#121b23] outline-none transition duration-100 placeholder:text-kac-steel-dark/85 focus-visible:border-kac-gold-darker focus-visible:ring-2 focus-visible:ring-kac-gold-dark/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-[1px_1px_0_0_#121b23] font-ui">
          P90: {metrics.p90Ms.toFixed(0)} ms
        </p>
        <p className="border-[3px] border-b-[6px] border-kac-iron bg-gradient-to-b from-[#fffdf5] to-kac-bone-light px-3 py-2 text-kac-iron shadow-[2px_2px_0_0_#121b23] outline-none transition duration-100 placeholder:text-kac-steel-dark/85 focus-visible:border-kac-gold-darker focus-visible:ring-2 focus-visible:ring-kac-gold-dark/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-[1px_1px_0_0_#121b23] font-ui">
          Updated: {new Date(metrics.updatedAtIso).toLocaleTimeString()}
        </p>
      </div>
    </Section>
  );
};
