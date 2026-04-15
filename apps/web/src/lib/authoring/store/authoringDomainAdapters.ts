import type { AdventureModuleDetail } from "@mighty-decks/spec/adventureModuleAuthoring";
import type { CampaignDetail } from "@mighty-decks/spec/campaign";
import {
  createAdventureModuleActor,
  createAdventureModuleAsset,
  createAdventureModuleCounter,
  createAdventureModuleEncounter,
  createAdventureModuleLocation,
  createAdventureModuleQuest,
  deleteAdventureModuleActor,
  deleteAdventureModuleAsset,
  deleteAdventureModuleCounter,
  deleteAdventureModuleEncounter,
  deleteAdventureModuleLocation,
  deleteAdventureModuleQuest,
  getAdventureModuleBySlug,
  updateAdventureModuleActor,
  updateAdventureModuleAsset,
  updateAdventureModuleCounter,
  updateAdventureModuleCoverImage,
  updateAdventureModuleEncounter,
  updateAdventureModuleFragment,
  updateAdventureModuleIndex,
  updateAdventureModuleLocation,
  updateAdventureModuleQuest,
} from "../../adventureModuleApi";
import {
  createCampaignActor,
  createCampaignAsset,
  createCampaignCounter,
  createCampaignEncounter,
  createCampaignLocation,
  createCampaignQuest,
  deleteCampaignActor,
  deleteCampaignAsset,
  deleteCampaignCounter,
  deleteCampaignEncounter,
  deleteCampaignLocation,
  deleteCampaignQuest,
  getCampaignBySlug,
  updateCampaignActor,
  updateCampaignAsset,
  updateCampaignCounter,
  updateCampaignCoverImage,
  updateCampaignEncounter,
  updateCampaignFragment,
  updateCampaignIndex,
  updateCampaignLocation,
  updateCampaignQuest,
} from "../../campaignApi";
import type { AuthoringDomainAdapter } from "./authoringStoreTypes";

export const adventureModuleAuthoringAdapter: AuthoringDomainAdapter<AdventureModuleDetail> =
  {
    detailType: "module",
    detailLabel: "module",
    loadBySlug: ({ slug, creatorToken }) =>
      getAdventureModuleBySlug(slug, creatorToken),
    updateIndex: (detailId, index, creatorToken) =>
      updateAdventureModuleIndex(detailId, index, creatorToken),
    updateFragment: (detailId, fragmentId, content, creatorToken) =>
      updateAdventureModuleFragment(detailId, fragmentId, content, creatorToken),
    updateActor: (detailId, actorSlug, payload, creatorToken) =>
      updateAdventureModuleActor(detailId, actorSlug, payload, creatorToken),
    updateLocation: (detailId, locationSlug, payload, creatorToken) =>
      updateAdventureModuleLocation(detailId, locationSlug, payload, creatorToken),
    updateEncounter: (detailId, encounterSlug, payload, creatorToken) =>
      updateAdventureModuleEncounter(detailId, encounterSlug, payload, creatorToken),
    updateQuest: (detailId, questSlug, payload, creatorToken) =>
      updateAdventureModuleQuest(detailId, questSlug, payload, creatorToken),
    updateCounter: (detailId, counterSlug, payload, creatorToken) =>
      updateAdventureModuleCounter(detailId, counterSlug, payload, creatorToken),
    updateAsset: (detailId, assetSlug, payload, creatorToken) =>
      updateAdventureModuleAsset(detailId, assetSlug, payload, creatorToken),
    updateCoverImage: (detailId, payload, creatorToken) =>
      updateAdventureModuleCoverImage(detailId, payload, creatorToken),
    createActor: (detailId, payload, creatorToken) =>
      createAdventureModuleActor(detailId, payload, creatorToken),
    createLocation: (detailId, payload, creatorToken) =>
      createAdventureModuleLocation(detailId, payload, creatorToken),
    createEncounter: (detailId, payload, creatorToken) =>
      createAdventureModuleEncounter(detailId, payload, creatorToken),
    createQuest: (detailId, payload, creatorToken) =>
      createAdventureModuleQuest(detailId, payload, creatorToken),
    createCounter: (detailId, payload, creatorToken) =>
      createAdventureModuleCounter(detailId, payload, creatorToken),
    createAsset: (detailId, payload, creatorToken) =>
      createAdventureModuleAsset(detailId, payload, creatorToken),
    deleteActor: (detailId, actorSlug, creatorToken) =>
      deleteAdventureModuleActor(detailId, actorSlug, creatorToken),
    deleteLocation: (detailId, locationSlug, creatorToken) =>
      deleteAdventureModuleLocation(detailId, locationSlug, creatorToken),
    deleteEncounter: (detailId, encounterSlug, creatorToken) =>
      deleteAdventureModuleEncounter(detailId, encounterSlug, creatorToken),
    deleteQuest: (detailId, questSlug, creatorToken) =>
      deleteAdventureModuleQuest(detailId, questSlug, creatorToken),
    deleteCounter: (detailId, counterSlug, creatorToken) =>
      deleteAdventureModuleCounter(detailId, counterSlug, creatorToken),
    deleteAsset: (detailId, assetSlug, creatorToken) =>
      deleteAdventureModuleAsset(detailId, assetSlug, creatorToken),
    getDetailId: (detail) => detail.index.moduleId,
  };

export const campaignAuthoringAdapter: AuthoringDomainAdapter<CampaignDetail> = {
  detailType: "campaign",
  detailLabel: "campaign",
  loadBySlug: ({ slug, creatorToken }) => getCampaignBySlug(slug, creatorToken),
  updateIndex: (detailId, index, creatorToken) =>
    updateCampaignIndex(detailId, index, creatorToken),
  updateFragment: (detailId, fragmentId, content, creatorToken) =>
    updateCampaignFragment(detailId, fragmentId, content, creatorToken),
  updateActor: (detailId, actorSlug, payload, creatorToken) =>
    updateCampaignActor(detailId, actorSlug, payload, creatorToken),
  updateLocation: (detailId, locationSlug, payload, creatorToken) =>
    updateCampaignLocation(detailId, locationSlug, payload, creatorToken),
  updateEncounter: (detailId, encounterSlug, payload, creatorToken) =>
    updateCampaignEncounter(detailId, encounterSlug, payload, creatorToken),
  updateQuest: (detailId, questSlug, payload, creatorToken) =>
    updateCampaignQuest(detailId, questSlug, payload, creatorToken),
  updateCounter: (detailId, counterSlug, payload, creatorToken) =>
    updateCampaignCounter(detailId, counterSlug, payload, creatorToken),
  updateAsset: (detailId, assetSlug, payload, creatorToken) =>
    updateCampaignAsset(detailId, assetSlug, payload, creatorToken),
  updateCoverImage: (detailId, payload, creatorToken) =>
    updateCampaignCoverImage(detailId, payload, creatorToken),
  createActor: (detailId, payload, creatorToken) =>
    createCampaignActor(detailId, payload, creatorToken),
  createLocation: (detailId, payload, creatorToken) =>
    createCampaignLocation(detailId, payload, creatorToken),
  createEncounter: (detailId, payload, creatorToken) =>
    createCampaignEncounter(detailId, payload, creatorToken),
  createQuest: (detailId, payload, creatorToken) =>
    createCampaignQuest(detailId, payload, creatorToken),
  createCounter: (detailId, payload, creatorToken) =>
    createCampaignCounter(detailId, payload, creatorToken),
  createAsset: (detailId, payload, creatorToken) =>
    createCampaignAsset(detailId, payload, creatorToken),
  deleteActor: (detailId, actorSlug, creatorToken) =>
    deleteCampaignActor(detailId, actorSlug, creatorToken),
  deleteLocation: (detailId, locationSlug, creatorToken) =>
    deleteCampaignLocation(detailId, locationSlug, creatorToken),
  deleteEncounter: (detailId, encounterSlug, creatorToken) =>
    deleteCampaignEncounter(detailId, encounterSlug, creatorToken),
  deleteQuest: (detailId, questSlug, creatorToken) =>
    deleteCampaignQuest(detailId, questSlug, creatorToken),
  deleteCounter: (detailId, counterSlug, creatorToken) =>
    deleteCampaignCounter(detailId, counterSlug, creatorToken),
  deleteAsset: (detailId, assetSlug, creatorToken) =>
    deleteCampaignAsset(detailId, assetSlug, creatorToken),
  getDetailId: (detail) => detail.index.moduleId,
};
