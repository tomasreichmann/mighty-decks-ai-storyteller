import type { LatencyMetrics } from "@mighty-decks/spec/adventureState";
import { Section } from "./common/Section";
import { Text } from "./common/Text";
import { Label } from "./common/Label";

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
        <Text
          variant="body"
          color="iron"
          className="relative border-[3px] border-b-[6px] border-kac-iron bg-gradient-to-b from-[#fffdf5] to-kac-bone-light px-3 py-2 pt-5 shadow-[2px_2px_0_0_#121b23] outline-none transition duration-100 placeholder:text-kac-steel-dark/85 focus-visible:border-kac-gold-darker focus-visible:ring-2 focus-visible:ring-kac-gold-dark/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-[1px_1px_0_0_#121b23]"
        >
          <Label className="absolute -left-2 -top-2">Samples:</Label>{" "}
          {metrics.actionCount}
        </Text>
        <Text
          variant="body"
          color="iron"
          className="relative border-[3px] border-b-[6px] border-kac-iron bg-gradient-to-b from-[#fffdf5] to-kac-bone-light px-3 py-2 pt-5 shadow-[2px_2px_0_0_#121b23] outline-none transition duration-100 placeholder:text-kac-steel-dark/85 focus-visible:border-kac-gold-darker focus-visible:ring-2 focus-visible:ring-kac-gold-dark/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-[1px_1px_0_0_#121b23]"
        >
          <Label className="absolute -left-2 -top-2">Average:</Label>{" "}
          {metrics.averageMs.toFixed(0)} ms
        </Text>
        <Text
          variant="body"
          color="iron"
          className="relative border-[3px] border-b-[6px] border-kac-iron bg-gradient-to-b from-[#fffdf5] to-kac-bone-light px-3 py-2 pt-5 shadow-[2px_2px_0_0_#121b23] outline-none transition duration-100 placeholder:text-kac-steel-dark/85 focus-visible:border-kac-gold-darker focus-visible:ring-2 focus-visible:ring-kac-gold-dark/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-[1px_1px_0_0_#121b23]"
        >
          <Label className="absolute -left-2 -top-2">P90:</Label>{" "}
          {metrics.p90Ms.toFixed(0)} ms
        </Text>
        <Text
          variant="body"
          color="iron"
          className="relative border-[3px] border-b-[6px] border-kac-iron bg-gradient-to-b from-[#fffdf5] to-kac-bone-light px-3 py-2 pt-5 shadow-[2px_2px_0_0_#121b23] outline-none transition duration-100 placeholder:text-kac-steel-dark/85 focus-visible:border-kac-gold-darker focus-visible:ring-2 focus-visible:ring-kac-gold-dark/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-[1px_1px_0_0_#121b23]"
        >
          <Label className="absolute -left-2 -top-2">Updated:</Label>{" "}
          {new Date(metrics.updatedAtIso).toLocaleTimeString()}
        </Text>
      </div>
    </Section>
  );
};
