import { Link } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Heading } from "../components/common/Heading";
import { Label } from "../components/common/Label";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";
import { StyleguideSectionNav } from "../components/styleguide/StyleguideSectionNav";

const cardLabs = [
  {
    title: "Location Card",
    description:
      "Image-first location exploration with the cloth chip and pinned icon treatment.",
    tone: "cloth" as const,
    href: "/styleguide/location-card",
  },
  {
    title: "Encounter Card",
    description:
      "Warning-forward encounter preview with the fire chip and mirrored icon treatment.",
    tone: "fire" as const,
    href: "/styleguide/encounter-card",
  },
  {
    title: "Quest Card",
    description:
      "Quest-focused preview with the gold chip and scroll icon treatment.",
    tone: "gold" as const,
    href: "/styleguide/quest-card",
  },
] as const;

export const StyleguideCardsPage = (): JSX.Element => {
  return (
    <div className="styleguide-cards-page app-shell stack gap-6 py-8">
      <StyleguideSectionNav />

      <div className="stack gap-2">
        <Label variant="gold" className="self-start">
          Card Labs
        </Label>
        <Heading
          variant="h1"
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
          Cards
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
          The card family now lives on its own page so each direction can be
          explored without scrolling past unrelated controls.
        </Text>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {cardLabs.map((card) => (
          <Panel
            key={card.title}
            as="section"
            tone={card.tone}
            contentClassName="stack gap-3"
          >
            <div className="stack gap-1">
              <Text variant="h3" color="iron">
                {card.title}
              </Text>
              <Text variant="body" color="iron-light" className="text-sm">
                {card.description}
              </Text>
            </div>

            <Button href={card.href} color="gold" size="sm">
              Open Gallery
            </Button>
          </Panel>
        ))}
      </div>

      <Panel as="section" tone="bone" contentClassName="stack gap-2">
        <Text variant="h3" color="iron">
          Why this page exists
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          The detailed card pages still hold the visual deep dives, but this
          page gives contributors one place to jump to the card they want to
          refine.
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
