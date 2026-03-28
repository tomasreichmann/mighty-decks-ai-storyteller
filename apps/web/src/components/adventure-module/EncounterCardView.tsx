import type { AdventureModuleResolvedEncounter } from "@mighty-decks/spec/adventureModuleAuthoring";
import { EncounterCard } from "../styleguide/EncounterCard";
import { toMarkdownPlainTextSnippet } from "../../lib/markdownSnippet";
import { resolveServerUrl } from "../../lib/socket";
import { cn } from "../../utils/cn";
import { AUTHORED_SCENE_CARD_CLASS } from "./sceneCardSizing";

interface EncounterCardViewProps {
  encounter: AdventureModuleResolvedEncounter;
  className?: string;
}

interface InvalidEncounterCardViewProps {
  slug?: string;
  className?: string;
}

const toPlainText = (value: string | undefined, maxLength: number): string =>
  value ? toMarkdownPlainTextSnippet(value, maxLength).trim() : "";

const toImageSrc = (imageUrl: string): string => {
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("data:")
  ) {
    return imageUrl;
  }

  return new URL(imageUrl, resolveServerUrl()).toString();
};

const getEncounterImage = (
  encounter: AdventureModuleResolvedEncounter,
): string =>
  encounter.titleImageUrl?.trim()
    ? toImageSrc(encounter.titleImageUrl)
    : "/sample-scene-image.png";

const getEncounterDescription = (
  encounter: AdventureModuleResolvedEncounter,
): string =>
  toPlainText(encounter.summary, 140) || toPlainText(encounter.content, 140);

export const EncounterCardView = ({
  encounter,
  className,
}: EncounterCardViewProps): JSX.Element => {
  return (
    <EncounterCard
      imageUrl={getEncounterImage(encounter)}
      imageAlt={encounter.title}
      title={encounter.title}
      description={getEncounterDescription(encounter)}
      className={cn(AUTHORED_SCENE_CARD_CLASS, className)}
    />
  );
};

export const InvalidEncounterCardView = ({
  slug,
  className,
}: InvalidEncounterCardViewProps): JSX.Element => {
  const summary =
    typeof slug === "string" && slug.trim().length > 0
      ? `Encounter / ${slug}`
      : "Missing or unknown encounter props";

  return (
    <span
      className={cn(
        "inline-flex max-w-[20rem] flex-col rounded border-2 border-dashed border-kac-blood-dark/70 bg-kac-bone-light/70 px-3 py-2 text-left font-ui text-xs text-kac-iron shadow-[2px_2px_0_0_#121b23]",
        className,
      )}
    >
      <span className="font-bold uppercase tracking-[0.08em] text-kac-blood-dark">
        Invalid EncounterCard
      </span>
      <span>{summary}</span>
    </span>
  );
};
