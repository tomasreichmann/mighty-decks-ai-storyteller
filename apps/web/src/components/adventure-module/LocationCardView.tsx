import type { AdventureModuleResolvedLocation } from "@mighty-decks/spec/adventureModuleAuthoring";
import { LocationCard } from "../styleguide/LocationCard";
import { toMarkdownPlainTextSnippet } from "../../lib/markdownSnippet";
import { resolveServerUrl } from "../../lib/socket";
import { cn } from "../../utils/cn";
import { AUTHORED_SCENE_CARD_CLASS } from "./sceneCardSizing";

interface LocationCardViewProps {
  location: AdventureModuleResolvedLocation;
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

const getLocationImage = (location: AdventureModuleResolvedLocation): string =>
  location.titleImageUrl?.trim()
    ? toImageSrc(location.titleImageUrl)
    : "/sample-scene-image.png";

const getLocationDescription = (
  location: AdventureModuleResolvedLocation,
): string =>
  toPlainText(location.summary, 140) ||
  toPlainText(location.introductionMarkdown, 140);

export const LocationCardView = ({
  location,
  className,
}: LocationCardViewProps): JSX.Element => {
  return (
    <LocationCard
      imageUrl={getLocationImage(location)}
      imageAlt={location.title}
      title={location.title}
      description={getLocationDescription(location)}
      className={cn(AUTHORED_SCENE_CARD_CLASS, className)}
    />
  );
};
