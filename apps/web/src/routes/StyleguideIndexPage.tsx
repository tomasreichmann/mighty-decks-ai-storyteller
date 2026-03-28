import { Link } from "react-router-dom";
import { Heading } from "../components/common/Heading";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";
import { Label } from "../components/common/Label";

export const StyleguideIndexPage = (): JSX.Element => {
  return (
    <div className="app-shell stack gap-6 py-8">
      <div className="stack gap-2">
        <Label variant="cloth" className="self-start">
          Internal
        </Label>
        <Heading
          variant="h1"
          color="iron"
          className="text-[2.4rem] sm:text-[3.4rem]"
          highlightProps={{ color: "gold" }}
        >
          Styleguide
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
          Hidden component playground for iterating on visual directions without
          touching the main player or storyteller flows.
        </Text>
      </div>

      <Panel as="section" tone="bone" contentClassName="stack gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="stack gap-1">
            <Text variant="h3" color="iron">
              Location Card
            </Text>
            <Text variant="body" color="iron-light" className="text-sm">
              Current local LocationCard direction for the location-focused
              GameCard.
            </Text>
          </div>
          <Link
            to="/styleguide/location-card"
            className="inline-flex items-center rounded-sm border-2 border-kac-iron bg-gradient-to-b from-kac-gold to-kac-gold-dark px-4 py-2 font-ui text-sm font-bold uppercase tracking-[0.08em] text-kac-iron shadow-[3px_3px_0_0_#121b23] transition duration-100 hover:brightness-[1.03] active:translate-y-[2px] active:shadow-[1px_1px_0_0_#121b23]"
          >
            Open Gallery
          </Link>
        </div>
      </Panel>

      <Panel as="section" tone="bone" contentClassName="stack gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="stack gap-1">
            <Text variant="h3" color="iron">
              Encounter Card
            </Text>
            <Text variant="body" color="iron-light" className="text-sm">
              Shared scene-card direction adapted for encounter embeds and
              authoring previews.
            </Text>
          </div>
          <Link
            to="/styleguide/encounter-card"
            className="inline-flex items-center rounded-sm border-2 border-kac-iron bg-gradient-to-b from-kac-gold to-kac-gold-dark px-4 py-2 font-ui text-sm font-bold uppercase tracking-[0.08em] text-kac-iron shadow-[3px_3px_0_0_#121b23] transition duration-100 hover:brightness-[1.03] active:translate-y-[2px] active:shadow-[1px_1px_0_0_#121b23]"
          >
            Open Gallery
          </Link>
        </div>
      </Panel>

      <Panel as="section" tone="bone" contentClassName="stack gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="stack gap-1">
            <Text variant="h3" color="iron">
              Quest Card
            </Text>
            <Text variant="body" color="iron-light" className="text-sm">
              Shared scene-card direction adapted for quest embeds and authoring
              previews.
            </Text>
          </div>
          <Link
            to="/styleguide/quest-card"
            className="inline-flex items-center rounded-sm border-2 border-kac-iron bg-gradient-to-b from-kac-gold to-kac-gold-dark px-4 py-2 font-ui text-sm font-bold uppercase tracking-[0.08em] text-kac-iron shadow-[3px_3px_0_0_#121b23] transition duration-100 hover:brightness-[1.03] active:translate-y-[2px] active:shadow-[1px_1px_0_0_#121b23]"
          >
            Open Gallery
          </Link>
        </div>
      </Panel>
    </div>
  );
};
