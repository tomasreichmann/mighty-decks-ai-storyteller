import type {
  AdventureModuleResolvedActor,
  AdventureModuleResolvedAsset,
  AdventureModuleResolvedCounter,
} from "@mighty-decks/spec/adventureModuleAuthoring";
import type {
  AssetBaseSlug,
  AssetModifierSlug,
} from "@mighty-decks/spec/assetCards";
import {
  assetBaseCardsBySlug,
  assetModifierCardsBySlug,
} from "../data/assetCards";
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
  modifierSlug?: string;
  legacyToken: string;
  jsx: string;
  label: string;
}

interface GenericResolvedAssetCardRecord {
  kind: "generic";
  assetSlug: AssetBaseSlug;
  baseAssetSlug: AssetBaseSlug;
  modifierSlug?: AssetModifierSlug;
  title: string;
}

type ResolvedAssetCardRecord =
  | AdventureModuleResolvedAsset
  | GenericResolvedAssetCardRecord;

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
    }
  | {
      type: "CounterCard";
      slug: string;
      legacyToken: string;
      jsx: string;
      counter: AdventureModuleResolvedCounter;
    }
  | {
      type: "AssetCard";
      slug: string;
      legacyToken: string;
      jsx: string;
      asset: ResolvedAssetCardRecord;
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
const builtInAssetsBySlug = new Map(
  Array.from(assetBaseCardsBySlug.values()).map((asset) => [
    asset.slug.toLocaleLowerCase(),
    {
      kind: "generic",
      assetSlug: asset.slug,
      baseAssetSlug: asset.slug,
      modifierSlug: undefined,
      title: asset.title,
    } satisfies ResolvedAssetCardRecord,
  ] as const),
);

export const gameCardTypes = [
  "OutcomeCard",
  "EffectCard",
  "StuntCard",
  "ActorCard",
  "CounterCard",
  "AssetCard",
] as const satisfies readonly GameCardType[];

const gameCardTypeToLegacyPrefix: Record<GameCardType, string> = {
  OutcomeCard: "outcome",
  EffectCard: "effect",
  StuntCard: "stunt",
  ActorCard: "actor",
  CounterCard: "counter",
  AssetCard: "asset",
};

const toOption = (
  type: GameCardType,
  slug: string,
  title: string,
  options: {
    modifierSlug?: string;
  } = {},
): GameCardOption => ({
  type,
  slug,
  modifierSlug: options.modifierSlug,
  legacyToken: `@${gameCardTypeToLegacyPrefix[type]}/${slug}`,
  jsx: createGameCardJsx(type, slug, {
    modifierSlug: options.modifierSlug,
  }),
  label: title,
});

export const gameCardTypeLabel: Record<GameCardType, string> = {
  OutcomeCard: "Outcome",
  EffectCard: "Effect",
  StuntCard: "Stunt",
  ActorCard: "Actor",
  CounterCard: "Counter",
  AssetCard: "Asset",
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
  CounterCard: [],
  AssetCard: [],
};

export const createActorGameCardOption = (
  actor: AdventureModuleResolvedActor,
): GameCardOption =>
  toOption("ActorCard", actor.actorSlug, actor.title);

export const createCounterGameCardOption = (
  counter: AdventureModuleResolvedCounter,
): GameCardOption =>
  toOption("CounterCard", counter.slug, counter.title);

export const createAssetGameCardOption = (
  asset: AdventureModuleResolvedAsset,
): GameCardOption =>
  toOption("AssetCard", asset.assetSlug, asset.title);

export const buildGameCardOptionsByType = (
  actors: readonly AdventureModuleResolvedActor[] = [],
  counters: readonly AdventureModuleResolvedCounter[] = [],
  assets: readonly AdventureModuleResolvedAsset[] = [],
): Record<GameCardType, GameCardOption[]> => ({
  ...baseGameCardOptionsByType,
  ActorCard: actors.map(createActorGameCardOption),
  CounterCard: counters.map(createCounterGameCardOption),
  AssetCard: assets
    .filter((asset) => asset.kind === "custom")
    .map(createAssetGameCardOption),
});

export const gameCardOptionsByType = buildGameCardOptionsByType();

export const resolveGameCard = (
  type: GameCardType,
  slug: string,
  moduleActorsBySlug?: ReadonlyMap<string, AdventureModuleResolvedActor>,
  moduleCountersBySlug?: ReadonlyMap<string, AdventureModuleResolvedCounter>,
  moduleAssetsBySlug?: ReadonlyMap<string, AdventureModuleResolvedAsset>,
  modifierSlug?: string,
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
    case "CounterCard": {
      const counter = moduleCountersBySlug?.get(key);
      if (!counter) {
        return null;
      }
      return {
        type,
        slug: counter.slug,
        legacyToken: `@counter/${counter.slug}`,
        jsx: createGameCardJsx(type, counter.slug),
        counter,
      };
    }
    case "AssetCard": {
      const normalizedModifierSlug =
        typeof modifierSlug === "string" && modifierSlug.trim().length > 0
          ? modifierSlug.trim()
          : undefined;

      if (normalizedModifierSlug) {
        if (!assetModifierCardsBySlug.has(normalizedModifierSlug as AssetModifierSlug)) {
          return null;
        }

        const asset = builtInAssetsBySlug.get(key);
        if (!asset) {
          return null;
        }

        const validatedModifierSlug =
          normalizedModifierSlug as AssetModifierSlug;

        return {
          type,
          slug: asset.assetSlug,
          legacyToken: `@asset/${asset.assetSlug}`,
          jsx: createGameCardJsx(type, asset.assetSlug, {
            modifierSlug: validatedModifierSlug,
          }),
          asset: {
            ...asset,
            modifierSlug: validatedModifierSlug,
          },
        };
      }

      const moduleAsset = moduleAssetsBySlug?.get(key);
      if (moduleAsset) {
        return {
          type,
          slug: moduleAsset.assetSlug,
          legacyToken: `@asset/${moduleAsset.assetSlug}`,
          jsx: createGameCardJsx(type, moduleAsset.assetSlug),
          asset: moduleAsset,
        };
      }

      const asset = builtInAssetsBySlug.get(key);
      if (!asset) {
        return null;
      }

      return {
        type,
        slug: asset.assetSlug,
        legacyToken: `@asset/${asset.assetSlug}`,
        jsx: createGameCardJsx(type, asset.assetSlug),
        asset,
      };
    }
    default:
      return null;
  }
};

export const resolveLegacyGameCardToken = (
  value: string,
  moduleActorsBySlug?: ReadonlyMap<string, AdventureModuleResolvedActor>,
  moduleCountersBySlug?: ReadonlyMap<string, AdventureModuleResolvedCounter>,
  moduleAssetsBySlug?: ReadonlyMap<string, AdventureModuleResolvedAsset>,
): ResolvedGameCard | null => {
  const parsed = parseLegacyGameCardToken(value);
  if (!parsed) {
    return null;
  }
  return resolveGameCard(
    parsed.type,
    parsed.slug,
    moduleActorsBySlug,
    moduleCountersBySlug,
    moduleAssetsBySlug,
    parsed.modifierSlug,
  );
};

export const defaultGameCardType = gameCardTypes[0];
