import { Link } from "react-router-dom";
import { Heading } from "../components/common/Heading";
import { Label } from "../components/common/Label";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";
import { StyleguideSectionNav } from "../components/styleguide/StyleguideSectionNav";

const panelSamples = [
  {
    tone: "bone" as const,
    title: "Primary surface",
    description:
      "Use bone for the lightest, most general-purpose framed surface in the system.",
  },
  {
    tone: "gold" as const,
    title: "Callout surface",
    description:
      "Use gold when a framed surface needs to feel warmer and a little more attention-grabbing.",
  },
  {
    tone: "cloth" as const,
    title: "Support surface",
    description:
      "Use cloth for softer supporting containers that should sit back behind the main story task.",
  },
  {
    tone: "fire" as const,
    title: "Alert surface",
    description:
      "Use fire when the framed panel carries urgency, warning, or a strong editorial cue.",
  },
] as const;

export const StyleguidePanelPage = (): JSX.Element => {
  return (
    <div className="styleguide-panel-page app-shell stack gap-6 py-8">
      <StyleguideSectionNav />

      <div className="stack gap-2">
        <Label color="gold" className="self-start">
          Surfaces
        </Label>
        <Heading
          level="h1"
          color="iron"
          className="relative z-0 text-[2.4rem] leading-none sm:text-[3.4rem] sm:leading-none"
          highlightProps={{
            color: "cloth",
            lineHeight: 8,
            brushHeight: 6,
            lineOffsets: [0, 8, 14, 20],
            className:
              "left-1/2 bottom-[0.08em] h-[0.5em] w-[calc(100%+0.22em)] -translate-x-1/2",
          }}
        >
          Panel
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
          Panel is the heavy framed surface in the system. Use it for major
          story blocks, not as a default wrapper for every small subsection.
        </Text>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {panelSamples.map((sample) => (
          <Panel
            key={sample.title}
            as="section"
            tone={sample.tone}
            contentClassName="stack gap-3"
          >
            <Label color={sample.tone} rotate={false} className="self-start">
              {sample.tone}
            </Label>
            <Text variant="h3" color="iron">
              {sample.title}
            </Text>
            <Text variant="body" color="iron-light" className="text-sm">
              {sample.description}
            </Text>
          </Panel>
        ))}
      </div>

      <Panel as="section" tone="bone" contentClassName="stack gap-2">
        <Text variant="h3" color="iron">
          Where to use it
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          Reach for `Panel` when you need a framed major surface, summary block,
          or route-level section. If a piece of content does not need a frame,
          prefer spacing and simpler wrappers instead.
        </Text>
        <Link
          to="/styleguide"
          className="inline-flex items-center gap-2 self-start font-ui text-sm font-bold uppercase tracking-[0.08em] text-kac-iron transition hover:text-kac-blood-dark"
        >
          <span aria-hidden="true">&larr;</span>
          Back to Overview
        </Link>
      </Panel>
    </div>
  );
};
