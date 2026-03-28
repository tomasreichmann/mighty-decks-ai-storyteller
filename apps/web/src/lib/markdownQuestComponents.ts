import type { AdventureModuleResolvedQuest } from "@mighty-decks/spec/adventureModuleAuthoring";
import { createQuestCardJsx } from "./gameCardMarkdown";

export interface QuestCardOption {
  slug: string;
  jsx: string;
  label: string;
}

export interface ResolvedQuestCard {
  slug: string;
  jsx: string;
  quest: AdventureModuleResolvedQuest;
}

export const createQuestCardOption = (
  quest: AdventureModuleResolvedQuest,
): QuestCardOption => ({
  slug: quest.questSlug,
  jsx: createQuestCardJsx(quest.questSlug),
  label: `${quest.title} (${quest.questSlug})`,
});

export const buildQuestCardOptions = (
  quests: readonly AdventureModuleResolvedQuest[] = [],
): QuestCardOption[] => quests.map(createQuestCardOption);

export const resolveQuestCard = (
  slug: string,
  moduleQuestsBySlug?: ReadonlyMap<string, AdventureModuleResolvedQuest>,
): ResolvedQuestCard | null => {
  const quest = moduleQuestsBySlug?.get(slug.trim().toLocaleLowerCase());
  if (!quest) {
    return null;
  }

  return {
    slug: quest.questSlug,
    jsx: createQuestCardJsx(quest.questSlug),
    quest,
  };
};
