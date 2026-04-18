import { Link } from "react-router-dom";
import { Heading } from "../components/common/Heading";
import { Label } from "../components/common/Label";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";
import { StyleguideSectionNav } from "../components/styleguide/StyleguideSectionNav";

const labelSamples = [
  {
    color: "gold" as const,
    title: "Gold",
    description:
      "Use for the clearest sticker, highlight, or primary callout when the label should read first.",
  },
  {
    color: "fire" as const,
    title: "Fire",
    description:
      "Use for warnings, urgency, and anything that should feel hot without turning into a full error surface.",
  },
  {
    color: "blood" as const,
    title: "Blood",
    description:
      "Use for destructive or irreversible stickers when the label itself should carry a hard consequence.",
  },
  {
    color: "bone" as const,
    title: "Bone",
    description:
      "Use for the calmest label tone when the sticker should sit back behind the story beat.",
  },
  {
    color: "steel" as const,
    title: "Steel",
    description:
      "Use for technical notes and machine-like markers that need to feel precise rather than emotional.",
  },
  {
    color: "skin" as const,
    title: "Skin",
    description:
      "Use for warm, human-facing labels that should feel tactile and personal.",
  },
  {
    color: "cloth" as const,
    title: "Cloth",
    description:
      "Use for supportive notes, informational stickers, and softer annotations.",
  },
  {
    color: "curse" as const,
    title: "Curse",
    description:
      "Use for errors, invalid state, and anything that should read as a live problem.",
  },
  {
    color: "monster" as const,
    title: "Monster",
    description:
      "Use for success, confirmation, and safe completion that should feel reassuring.",
  },
] as const;

const labelSizeSamples = [
  {
    size: "sm" as const,
    label: "Small",
    description: "Compact enough for narrow toolbars and dense inline surfaces.",
  },
  {
    size: "md" as const,
    label: "Medium",
    description: "The default size for most sticker and callout surfaces.",
  },
  {
    size: "lg" as const,
    label: "Large",
    description: "Useful when the label needs to feel more editorial and prominent.",
  },
] as const;

export const StyleguideLabelsPage = (): JSX.Element => {
  return (
    <div className="styleguide-labels-page app-shell stack gap-6 py-8">
      <StyleguideSectionNav />

      <div className="stack gap-2">
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
          Labels
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
          This page keeps the sticker-style `Label` primitive in one place so
          we can check tone, rotation, and size without mixing it into chip or
          message work.
        </Text>
      </div>

      <Panel as="section" tone="bone" contentClassName="stack gap-4">
        <div className="stack gap-1">
          <Text variant="h3" color="iron">
            Color family sheet
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            Each sample below uses the shared label shell so the tone choice,
            border weight, and hand-cut feel stay consistent across the system.
          </Text>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {labelSamples.map((sample) => (
            <div
              key={sample.title}
              className="stack gap-3 rounded-sm border-2 border-kac-iron bg-kac-bone-light/35 p-3 shadow-[3px_3px_0_0_#121b23]"
            >
              <Label color={sample.color} className="self-start">
                {sample.title}
              </Label>
              <Text variant="body" color="iron-light" className="text-sm">
                {sample.description}
              </Text>
            </div>
          ))}
        </div>
      </Panel>

      <Panel as="section" tone="cloth" contentClassName="stack gap-4">
        <div className="stack gap-1">
          <Text variant="h3" color="iron">
            Size ladder
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            Use the shared size prop to keep sticker labels aligned with nearby
            text. Turn rotation off when the label needs to sit flush with a
            row or list item.
          </Text>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {labelSizeSamples.map((sample) => (
            <div
              key={sample.size}
              className="stack gap-3 rounded-sm border-2 border-kac-iron bg-kac-bone-light/35 p-3 shadow-[3px_3px_0_0_#121b23]"
            >
              <Label color="gold" size={sample.size} rotate={false} className="self-start">
                {sample.label}
              </Label>
              <Text variant="body" color="iron-light" className="text-sm">
                {sample.description}
              </Text>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-kac-iron/15 pt-3">
          <Label color="gold">Rotated default</Label>
          <Label color="gold" rotate={false}>
            Flat alignment
          </Label>
          <Label color="cloth" size="sm">
            Small note
          </Label>
          <Label color="fire" size="lg" rotate={false}>
            Large warning
          </Label>
        </div>
      </Panel>

      <Panel as="section" tone="gold" contentClassName="stack gap-2">
        <Text variant="h3" color="iron">
          Where to use it
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          Use `Label` for stickers, badges, and compact status surfaces. Reach
          for `Tags` when the chips are editable, and keep the label page as the
          quickest place to confirm tone and size choices before reusing them
          elsewhere.
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
