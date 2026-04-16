import { Link } from "react-router-dom";
import { Heading } from "../components/common/Heading";
import { Label } from "../components/common/Label";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";
import { StyleguideSectionNav } from "../components/styleguide/StyleguideSectionNav";

const labelColors = [
  "gold",
  "fire",
  "blood",
  "bone",
  "steel",
  "skin",
  "cloth",
  "curse",
  "monster",
] as const;

const headingSamples = [
  { level: "h1" as const, title: "Heading level 1", highlight: "gold" as const },
  { level: "h2" as const, title: "Heading level 2", highlight: "fire" as const },
  { level: "h3" as const, title: "Heading level 3", highlight: "cloth" as const },
] as const;

export const StyleguideTypographyPage = (): JSX.Element => {
  return (
    <div className="styleguide-typography-page app-shell stack gap-6 py-8">
      <StyleguideSectionNav />

      <div className="stack gap-2">
        <Label color="gold" className="self-start">
          Typography
        </Label>
        <Heading
          level="h1"
          color="iron"
          className="relative z-0 text-[2.4rem] leading-none sm:text-[3.4rem] sm:leading-none"
          highlightProps={{
            color: "gold",
            lineHeight: 8,
            brushHeight: 6,
            lineOffsets: [0, 8, 14, 20],
            className:
              "left-1/2 bottom-[0.08em] h-[0.5em] w-[calc(100%+0.22em)] -translate-x-1/2",
          }}
        >
          Typography
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
          This page is the place to validate the typography API: labels for
          chips and stickers, text for copy, and headings for section titles.
        </Text>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel as="section" tone="bone" contentClassName="stack gap-4">
          <div className="stack gap-1">
            <Text variant="h3" color="iron">
              Label
            </Text>
            <Text variant="body" color="iron-light" className="text-sm">
              Use `Label` for stickers, chips, and small callouts that need a
              color and size choice.
            </Text>
          </div>
          <div className="flex flex-wrap gap-2">
            {labelColors.map((color) => (
              <Label key={color} color={color}>
                {color}
              </Label>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Label color="gold" size="sm">
              Small
            </Label>
            <Label color="gold" size="md">
              Medium
            </Label>
            <Label color="gold" size="lg">
              Large
            </Label>
          </div>
        </Panel>

        <Panel as="section" tone="cloth" contentClassName="stack gap-4">
          <div className="stack gap-1">
            <Text variant="h3" color="iron">
              Text
            </Text>
            <Text variant="body" color="iron-light" className="text-sm">
              Keep body copy, quotes, and small notes on the `Text` primitive
              so the tonal scale stays consistent.
            </Text>
          </div>
          <div className="stack gap-3">
            <Text variant="body" color="iron">
              Body text is the default reading size for long-form copy and
              paragraphs.
            </Text>
            <Text variant="emphasised" color="iron">
              Emphasised text is useful for short callouts, inline summaries,
              and labels that need more voice.
            </Text>
            <Text variant="quote" color="iron-light">
              Quote text is best for narrative beats or pull quotes that should
              stand apart from the rest of the layout.
            </Text>
            <Text variant="note" color="iron-light">
              Note text stays compact for helper copy, hints, and supporting
              instructions.
            </Text>
          </div>
        </Panel>

        <Panel as="section" tone="gold" contentClassName="stack gap-4">
          <div className="stack gap-1">
            <Text variant="h3" color="iron">
              Heading
            </Text>
            <Text variant="body" color="iron-light" className="text-sm">
              Use `Heading` for page titles, section titles, and large callout
              moments. Pick the semantic level explicitly with `level`, and
              let the highlight color shift with the tone of the section.
            </Text>
          </div>
          <div className="stack gap-3">
            {headingSamples.map((sample) => (
              <Heading
                key={sample.title}
                level={sample.level}
                color="iron"
                highlightProps={{ color: sample.highlight }}
              >
                {sample.title}
              </Heading>
            ))}
          </div>
        </Panel>
      </div>

      <Panel as="section" tone="bone" contentClassName="stack gap-2">
        <Text variant="h3" color="iron">
          Where to use it
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          Use `Label` for chips and stickers, `Text` for copy and annotations,
          and `Heading` for titles and section headers. The shared typography
          page is the quickest place to validate those APIs before touching
          consumers.
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
