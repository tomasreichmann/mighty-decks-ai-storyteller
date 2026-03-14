import type { AdventureModuleResolvedActor } from "@mighty-decks/spec/adventureModuleAuthoring";
import {
  rulesEffectCards,
  rulesOutcomeCards,
  rulesStuntCards,
  type RulesEffectCard,
  type RulesOutcomeCard,
  type RulesStuntCard,
} from "../data/rulesComponents";
import {
  createGameCardJsx,
  parseLegacyGameCardToken,
  type GameCardType,
} from "./gameCardMarkdown";

export type { GameCardType } from "./gameCardMarkdown";

export interface GameCardOption {
  type: GameCardType;
  slug: string;
  legacyToken: string;
  jsx: string;
  label: string;
}

export type ResolvedGameCard =
  | {
      type: "OutcomeCard";
      slug: string;
      legacyToken: string;
      jsx: string;
      card: RulesOutcomeCard;
    }
  | {
      type: "EffectCard";
      slug: string;
      legacyToken: string;
      jsx: string;
      card: RulesEffectCard;
    }
  | {
      type: "StuntCard";
      slug: string;
      legacyToken: string;
      jsx: string;
      card: RulesStuntCard;
    }
  | {
      type: "ActorCard";
      slug: string;
      legacyToken: string;
      jsx: string;
      actor: AdventureModuleResolvedActor;
    };

const dedupeBySlug = <T extends { slug: string }>(records: T[]): T[] => {
  const deduped: T[] = [];
  const seen = new Set<string>();

  for (const record of records) {
    const key = record.slug.toLocaleLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(record);
  }

  return deduped;
};

const outcomeCards = dedupeBySlug(rulesOutcomeCards);
const effectCards = dedupeBySlug(rulesEffectCards);
const stuntCards = dedupeBySlug(rulesStuntCards);

const outcomeBySlug = new Map(
  outcomeCards.map((card) => [card.slug.toLocaleLowerCase(), card] as const),
);
const effectBySlug = new Map(
  effectCards.map((card) => [card.slug.toLocaleLowerCase(), card] as const),
);
const stuntBySlug = new Map(
  stuntCards.map((card) => [card.slug.toLocaleLowerCase(), card] as const),
);

export const gameCardTypes = [
  "OutcomeCard",
  "EffectCard",
  "StuntCard",
  "ActorCard",
] as const satisfies readonly GameCardType[];

const gameCardTypeToLegacyPrefix: Record<GameCardType, string> = {
  OutcomeCard: "outcome",
  EffectCard: "effect",
  StuntCard: "stunt",
  ActorCard: "actor",
};

const toOption = (
  type: GameCardType,
  slug: string,
  title: string,
): GameCardOption => ({
  type,
  slug,
  legacyToken: `@${gameCardTypeToLegacyPrefix[type]}/${slug}`,
  jsx: createGameCardJsx(type, slug),
  label: `${title} (${slug})`,
});

export const gameCardTypeLabel: Record<GameCardType, string> = {
  OutcomeCard: "Outcome",
  EffectCard: "Effect",
  StuntCard: "Stunt",
  ActorCard: "Actor",
};

const baseGameCardOptionsByType: Record<GameCardType, GameCardOption[]> = {
  OutcomeCard: outcomeCards.map((card) =>
    toOption("OutcomeCard", card.slug, card.title),
  ),
  EffectCard: effectCards.map((card) =>
    toOption("EffectCard", card.slug, card.title),
  ),
  StuntCard: stuntCards.map((card) => toOption("StuntCard", card.slug, card.title)),
  ActorCard: [],
};

export const createActorGameCardOption = (
  actor: AdventureModuleResolvedActor,
): GameCardOption =>
  toOption("ActorCard", actor.actorSlug, actor.title);

export const buildGameCardOptionsByType = (
  actors: readonly AdventureModuleResolvedActor[] = [],
): Record<GameCardType, GameCardOption[]> => ({
  ...baseGameCardOptionsByType,
  ActorCard: actors.map(createActorGameCardOption),
});

export const gameCardOptionsByType = buildGameCardOptionsByType();

export const resolveGameCard = (
  type: GameCardType,
  slug: string,
  moduleActorsBySlug?: ReadonlyMap<string, AdventureModuleResolvedActor>,
): ResolvedGameCard | null => {
  const key = slug.trim().toLocaleLowerCase();
  switch (type) {
    case "OutcomeCard": {
      const card = outcomeBySlug.get(key);
      if (!card) {
        return null;
      }
      return {
        type,
        slug: card.slug,
        legacyToken: `@outcome/${card.slug}`,
        jsx: createGameCardJsx(type, card.slug),
        card,
      };
    }
    case "EffectCard": {
      const card = effectBySlug.get(key);
      if (!card) {
        return null;
      }
      return {
        type,
        slug: card.slug,
        legacyToken: `@effect/${card.slug}`,
        jsx: createGameCardJsx(type, card.slug),
        card,
      };
    }
    case "StuntCard": {
      const card = stuntBySlug.get(key);
      if (!card) {
        return null;
      }
      return {
        type,
        slug: card.slug,
        legacyToken: `@stunt/${card.slug}`,
        jsx: createGameCardJsx(type, card.slug),
        card,
      };
    }
    case "ActorCard": {
      const actor = moduleActorsBySlug?.get(key);
      if (!actor) {
        return null;
      }
      return {
        type,
        slug: actor.actorSlug,
        legacyToken: `@actor/${actor.actorSlug}`,
        jsx: createGameCardJsx(type, actor.actorSlug),
        actor,
      };
    }
    default:
      return null;
  }
};

export const resolveLegacyGameCardToken = (
  value: string,
  moduleActorsBySlug?: ReadonlyMap<string, AdventureModuleResolvedActor>,
): ResolvedGameCard | null => {
  const parsed = parseLegacyGameCardToken(value);
  if (!parsed) {
    return null;
  }
  return resolveGameCard(parsed.type, parsed.slug, moduleActorsBySlug);
};

export const defaultGameCardType = gameCardTypes[0];
