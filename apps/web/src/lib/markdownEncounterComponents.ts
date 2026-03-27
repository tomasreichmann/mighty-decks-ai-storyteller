import type { AdventureModuleResolvedEncounter } from "@mighty-decks/spec/adventureModuleAuthoring";
import { createEncounterCardJsx } from "./gameCardMarkdown";

export interface EncounterCardOption {
  slug: string;
  jsx: string;
  label: string;
}

export interface ResolvedEncounterCard {
  slug: string;
  jsx: string;
  encounter: AdventureModuleResolvedEncounter;
}

export const createEncounterCardOption = (
  encounter: AdventureModuleResolvedEncounter,
): EncounterCardOption => ({
  slug: encounter.encounterSlug,
  jsx: createEncounterCardJsx(encounter.encounterSlug),
  label: `${encounter.title} (${encounter.encounterSlug})`,
});

export const buildEncounterCardOptions = (
  encounters: readonly AdventureModuleResolvedEncounter[] = [],
): EncounterCardOption[] => encounters.map(createEncounterCardOption);

export const resolveEncounterCard = (
  slug: string,
  moduleEncountersBySlug?: ReadonlyMap<string, AdventureModuleResolvedEncounter>,
): ResolvedEncounterCard | null => {
  const encounter = moduleEncountersBySlug?.get(slug.trim().toLocaleLowerCase());
  if (!encounter) {
    return null;
  }

  return {
    slug: encounter.encounterSlug,
    jsx: createEncounterCardJsx(encounter.encounterSlug),
    encounter,
  };
};
