import {
  actorBaseLayerCatalog,
  actorTacticalRoleCatalog,
  actorTacticalSpecialCatalog,
} from "@mighty-decks/spec/actorCards";
import {
  adventureModuleFragmentAudienceSchema,
  adventureModuleFragmentKindSchema,
  adventureModuleLaunchProfileSchema,
  adventureModuleSessionScopeSchema,
  adventureModuleStatusSchema,
} from "@mighty-decks/spec/adventureModule";
import {
  assetBaseCatalog,
  assetModifierCatalog,
} from "@mighty-decks/spec/assetCards";
import { counterIconCatalog } from "@mighty-decks/spec/counterCards";
import {
  campaignOutcomeCardDefinitions,
} from "@mighty-decks/spec/outcomeDeck";
import {
  rulesEffectCards,
  rulesStuntCards,
} from "@mighty-decks/spec/rulesCards";

export const createAuthoringCatalogPayload = () => ({
  actorBaseLayers: actorBaseLayerCatalog,
  actorTacticalRoles: actorTacticalRoleCatalog,
  actorTacticalSpecials: actorTacticalSpecialCatalog,
  counterIcons: counterIconCatalog,
  assetBases: assetBaseCatalog,
  assetModifiers: assetModifierCatalog,
  moduleEnums: {
    status: [...adventureModuleStatusSchema.options],
    sessionScope: [...adventureModuleSessionScopeSchema.options],
    launchProfile: [...adventureModuleLaunchProfileSchema.options],
    fragmentKinds: [...adventureModuleFragmentKindSchema.options],
    fragmentAudiences: [...adventureModuleFragmentAudienceSchema.options],
  },
  outcomes: campaignOutcomeCardDefinitions.map((definition) => ({
    slug: definition.slug,
    title: definition.title,
    shortcode: definition.shortcode,
    count: definition.count,
  })),
  effects: rulesEffectCards.map((card) => ({
    slug: card.slug,
    title: card.title,
    shortcode: card.code,
    count: card.count,
    deck: card.deck,
  })),
  stunts: rulesStuntCards.map((card) => ({
    slug: card.slug,
    title: card.title,
    shortcode: card.code,
    count: card.count,
    deck: card.deck,
  })),
});

export type AuthoringCatalogPayload = ReturnType<
  typeof createAuthoringCatalogPayload
>;
