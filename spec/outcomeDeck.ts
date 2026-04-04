import type { OutcomeCardType } from "./adventureState";

export interface CampaignOutcomeCardDefinition {
  slug: OutcomeCardType;
  title: string;
  shortcode: string;
  count: number;
}

export const campaignOutcomeCardDefinitions = [
  {
    slug: "special-action",
    title: "Special Action",
    shortcode: "@outcome/special-action",
    count: 1,
  },
  {
    slug: "success",
    title: "Success",
    shortcode: "@outcome/success",
    count: 3,
  },
  {
    slug: "partial-success",
    title: "Partial Success",
    shortcode: "@outcome/partial-success",
    count: 3,
  },
  {
    slug: "fumble",
    title: "Fumble",
    shortcode: "@outcome/fumble",
    count: 4,
  },
  {
    slug: "chaos",
    title: "Chaos",
    shortcode: "@outcome/chaos",
    count: 1,
  },
] as const satisfies readonly CampaignOutcomeCardDefinition[];

export const campaignOutcomeDeckCardSlugs: OutcomeCardType[] =
  campaignOutcomeCardDefinitions.flatMap((definition) =>
    Array.from({ length: definition.count }, () => definition.slug),
  );

export const campaignOutcomeCardTitleBySlug = Object.fromEntries(
  campaignOutcomeCardDefinitions.map((definition) => [
    definition.slug,
    definition.title,
  ]),
) as Record<OutcomeCardType, string>;

export const campaignOutcomeCardShortcodeBySlug = Object.fromEntries(
  campaignOutcomeCardDefinitions.map((definition) => [
    definition.slug,
    definition.shortcode,
  ]),
) as Record<OutcomeCardType, string>;

const normalizeCharacterName = (value: string): string =>
  value.trim().replace(/\s+/g, " ");

export const formatCampaignOutcomeCardPlayMessage = (
  characterName: string,
  cardSlugs: readonly OutcomeCardType[],
): string => {
  const displayName = normalizeCharacterName(characterName);
  const resolvedName = displayName.length > 0 ? displayName : "Player";
  return `${resolvedName} played: ${cardSlugs
    .map((slug) => campaignOutcomeCardShortcodeBySlug[slug])
    .join(", ")}.`;
};
