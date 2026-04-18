import type { AdventureModuleResolvedLocation } from "@mighty-decks/spec/adventureModuleAuthoring";
import { createLocationCardJsx } from "./gameCardMarkdown";

export interface LocationCardOption {
  slug: string;
  jsx: string;
  label: string;
}

export interface ResolvedLocationCard {
  slug: string;
  jsx: string;
  location: AdventureModuleResolvedLocation;
}

export const createLocationCardOption = (
  location: AdventureModuleResolvedLocation,
): LocationCardOption => ({
  slug: location.locationSlug,
  jsx: createLocationCardJsx(location.locationSlug),
  label: location.title,
});

export const buildLocationCardOptions = (
  locations: readonly AdventureModuleResolvedLocation[] = [],
): LocationCardOption[] => locations.map(createLocationCardOption);

export const resolveLocationCard = (
  slug: string,
  moduleLocationsBySlug?: ReadonlyMap<string, AdventureModuleResolvedLocation>,
): ResolvedLocationCard | null => {
  const location = moduleLocationsBySlug?.get(slug.trim().toLocaleLowerCase());
  if (!location) {
    return null;
  }

  return {
    slug: location.locationSlug,
    jsx: createLocationCardJsx(location.locationSlug),
    location,
  };
};
