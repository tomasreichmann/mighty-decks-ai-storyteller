import React from "react";
import type {
  AdventureModuleResolvedEncounter,
  AdventureModuleResolvedLocation,
} from "@mighty-decks/spec/adventureModuleAuthoring";
import { Link } from "react-router-dom";
import { Text } from "../common/Text";
import { toMarkdownPlainTextSnippet } from "../../lib/markdownSnippet";
import { cn } from "../../utils/cn";
import { EncounterCard } from "./EncounterCard";
import { LocationCard } from "./LocationCard";

void React;

interface LocationGameCardProps {
  type: "location";
  location: AdventureModuleResolvedLocation;
  className?: string;
}

interface EncounterGameCardProps {
  type: "encounter";
  encounter: AdventureModuleResolvedEncounter;
  className?: string;
}

export type GameCardProps = LocationGameCardProps | EncounterGameCardProps;

const toPlainText = (value: string | undefined, maxLength: number): string =>
  value ? toMarkdownPlainTextSnippet(value, maxLength).trim() : "";

const getLocationTitleImage = (
  location: AdventureModuleResolvedLocation,
): string =>
  location.titleImageUrl?.trim() || "/sample-scene-image.png";

const getLocationSceneDescription = (
  location: AdventureModuleResolvedLocation,
): string =>
  toPlainText(location.introductionMarkdown, 140) ||
  toPlainText(location.summary, 140);

const getEncounterTitleImage = (
  encounter: AdventureModuleResolvedEncounter,
): string => encounter.titleImageUrl?.trim() || "/sample-scene-image.png";

const getEncounterSceneDescription = (
  encounter: AdventureModuleResolvedEncounter,
): string =>
  toPlainText(encounter.summary, 140) || toPlainText(encounter.content, 140);

const LocationGameCard = ({
  location,
  className,
}: Omit<LocationGameCardProps, "type">): JSX.Element => {
  return (
    <article className={cn("stack gap-3", className)}>
      <LocationCard
        imageUrl={getLocationTitleImage(location)}
        imageAlt={location.title}
        title={location.title}
        description={getLocationSceneDescription(location)}
        className="aspect-[3/2] h-auto w-full max-w-[42rem]"
      />
      <Text variant="note" color="iron-light" className="text-[11px] !opacity-100">
        LocationCard direction with a Location badge and a full-width summary strip.
      </Text>
    </article>
  );
};

const EncounterGameCard = ({
  encounter,
  className,
}: Omit<EncounterGameCardProps, "type">): JSX.Element => {
  return (
    <article className={cn("stack gap-3", className)}>
      <EncounterCard
        imageUrl={getEncounterTitleImage(encounter)}
        imageAlt={encounter.title}
        title={encounter.title}
        description={getEncounterSceneDescription(encounter)}
        className="aspect-[3/2] h-auto w-full max-w-[42rem]"
      />
      <Text variant="note" color="iron-light" className="text-[11px] !opacity-100">
        EncounterCard direction with a fire badge and a full-width summary strip.
      </Text>
    </article>
  );
};

export const GameCard = (props: GameCardProps): JSX.Element => {
  switch (props.type) {
    case "location":
      return <LocationGameCard {...props} />;
    case "encounter":
      return <EncounterGameCard {...props} />;
    default:
      return (
        <article className="rounded-sm border-2 border-kac-iron bg-kac-fire-lightest p-4 shadow-[4px_4px_0_0_#121b23]">
          <Text variant="body" color="iron">
            Unsupported GameCard.
          </Text>
        </article>
      );
  }
};

export const StyleguideBackLink = (): JSX.Element => (
  <Link
    to="/styleguide"
    className="inline-flex items-center gap-2 font-ui text-sm font-bold uppercase tracking-[0.08em] text-kac-iron transition hover:text-kac-blood-dark"
  >
    <span aria-hidden="true">&#8592;</span>
    Back to Styleguide
  </Link>
);
