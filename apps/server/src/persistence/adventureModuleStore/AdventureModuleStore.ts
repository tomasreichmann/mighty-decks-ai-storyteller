import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import type {
  AdventureModuleDetail,
  AdventureModuleListItem,
  AdventureModulePreviewResponse,
} from "@mighty-decks/spec/adventureModuleAuthoring";
import type { AdventureModuleIndex } from "@mighty-decks/spec/adventureModule";
import type { AdventureModuleStoreOptions, AdventureModuleStoreRuntime } from "./shared";
import { buildPreview } from "./preview";
import {
  checkSlugAvailability,
  cloneModule,
  createModule,
  deleteModule,
  getModule,
  getModuleBySlug,
  importModule,
  listModules,
  updateCoverImage,
  updateFragment,
  updateIndex,
} from "./lifecycle";
import {
  createActor,
  deleteActor,
  updateActor,
} from "./actors";
import {
  createAsset,
  deleteAsset,
  updateAsset,
} from "./assets";
import {
  createCounter,
  deleteCounter,
  updateCounter,
} from "./counters";
import {
  createEncounter,
  deleteEncounter,
  updateEncounter,
} from "./encounters";
import {
  createLocation,
  deleteLocation,
  updateLocation,
} from "./locations";
import {
  createQuest,
  deleteQuest,
  updateQuest,
} from "./quests";

export class AdventureModuleStore {
  private readonly runtime: AdventureModuleStoreRuntime;

  public constructor(options: AdventureModuleStoreOptions) {
    this.runtime = {
      rootDir: resolve(options.rootDir),
      moduleWriteLocks: new Map<string, Promise<void>>(),
    };
  }

  public async initialize(): Promise<void> {
    await mkdir(this.runtime.rootDir, { recursive: true });
  }

  public async listModules(creatorToken?: string): Promise<AdventureModuleListItem[]> {
    return listModules(this.runtime, creatorToken);
  }

  public async checkSlugAvailability(options: {
    slug: string;
    excludeModuleId?: string;
  }): Promise<{ available: boolean; reason?: string }> {
    return checkSlugAvailability(this.runtime, options);
  }

  public async createModule(options: {
    creatorToken?: string;
    title?: string;
    slug?: string;
    seedPrompt?: string;
    sessionScope?: AdventureModuleIndex["sessionScope"];
    launchProfile?: AdventureModuleIndex["launchProfile"];
  }): Promise<AdventureModuleDetail> {
    return createModule(this.runtime, options);
  }

  public async cloneModule(options: {
    sourceModuleId: string;
    creatorToken?: string;
    title?: string;
    slug?: string;
  }): Promise<AdventureModuleDetail> {
    return cloneModule(this.runtime, options);
  }

  public async importModule(options: {
    source: AdventureModuleDetail;
    creatorToken?: string;
    title?: string;
    slug?: string;
    status?: AdventureModuleIndex["status"];
  }): Promise<AdventureModuleDetail> {
    return importModule(this.runtime, options);
  }

  public async getModule(
    moduleId: string,
    creatorToken?: string,
  ): Promise<AdventureModuleDetail | null> {
    return getModule(this.runtime, moduleId, creatorToken);
  }

  public async getModuleBySlug(
    slug: string,
    creatorToken?: string,
  ): Promise<AdventureModuleDetail | null> {
    return getModuleBySlug(this.runtime, slug, creatorToken);
  }

  public async updateIndex(options: {
    moduleId: string;
    index: AdventureModuleIndex;
    creatorToken?: string;
  }): Promise<AdventureModuleDetail> {
    return updateIndex(this.runtime, options);
  }

  public async updateCoverImage(options: {
    moduleId: string;
    coverImageUrl?: string | null;
    creatorToken?: string;
  }): Promise<AdventureModuleDetail> {
    return updateCoverImage(this.runtime, options);
  }

  public async updateFragment(options: {
    moduleId: string;
    fragmentId: string;
    content: string;
    creatorToken?: string;
  }): Promise<AdventureModuleDetail> {
    return updateFragment(this.runtime, options);
  }

  public async createLocation(options: {
    moduleId: string;
    creatorToken?: string;
    title: string;
  }): Promise<AdventureModuleDetail> {
    return createLocation(this.runtime, options);
  }

  public async updateLocation(options: {
    moduleId: string;
    locationSlug: string;
    creatorToken?: string;
    title: string;
    summary: string;
    titleImageUrl?: string;
    introductionMarkdown: string;
    descriptionMarkdown: string;
    mapImageUrl?: string;
    mapPins: AdventureModuleIndex["locationDetails"][number]["mapPins"];
  }): Promise<AdventureModuleDetail> {
    return updateLocation(this.runtime, options);
  }

  public async deleteLocation(options: {
    moduleId: string;
    locationSlug: string;
    creatorToken?: string;
  }): Promise<AdventureModuleDetail> {
    return deleteLocation(this.runtime, options);
  }

  public async createEncounter(options: {
    moduleId: string;
    creatorToken?: string;
    title: string;
  }): Promise<AdventureModuleDetail> {
    return createEncounter(this.runtime, options);
  }

  public async updateEncounter(options: {
    moduleId: string;
    encounterSlug: string;
    creatorToken?: string;
    title: string;
    summary: string;
    prerequisites: string;
    titleImageUrl?: string;
    content: string;
  }): Promise<AdventureModuleDetail> {
    return updateEncounter(this.runtime, options);
  }

  public async deleteEncounter(options: {
    moduleId: string;
    encounterSlug: string;
    creatorToken?: string;
  }): Promise<AdventureModuleDetail> {
    return deleteEncounter(this.runtime, options);
  }

  public async createQuest(options: {
    moduleId: string;
    creatorToken?: string;
    title: string;
  }): Promise<AdventureModuleDetail> {
    return createQuest(this.runtime, options);
  }

  public async updateQuest(options: {
    moduleId: string;
    questSlug: string;
    creatorToken?: string;
    title: string;
    summary: string;
    titleImageUrl?: string;
    content: string;
  }): Promise<AdventureModuleDetail> {
    return updateQuest(this.runtime, options);
  }

  public async deleteQuest(options: {
    moduleId: string;
    questSlug: string;
    creatorToken?: string;
  }): Promise<AdventureModuleDetail> {
    return deleteQuest(this.runtime, options);
  }

  public async createActor(options: {
    moduleId: string;
    creatorToken?: string;
    title: string;
    isPlayerCharacter?: boolean;
  }): Promise<AdventureModuleDetail> {
    return createActor(this.runtime, options);
  }

  public async updateActor(options: {
    moduleId: string;
    actorSlug: string;
    creatorToken?: string;
    title: string;
    summary: string;
    baseLayerSlug: AdventureModuleIndex["actorCards"][number]["baseLayerSlug"];
    tacticalRoleSlug: AdventureModuleIndex["actorCards"][number]["tacticalRoleSlug"];
    tacticalSpecialSlug?: AdventureModuleIndex["actorCards"][number]["tacticalSpecialSlug"];
    isPlayerCharacter: boolean;
    content: string;
  }): Promise<AdventureModuleDetail> {
    return updateActor(this.runtime, options);
  }

  public async deleteActor(options: {
    moduleId: string;
    actorSlug: string;
    creatorToken?: string;
  }): Promise<AdventureModuleDetail> {
    return deleteActor(this.runtime, options);
  }

  public async createAsset(options: {
    moduleId: string;
    creatorToken?: string;
    title: string;
  }): Promise<AdventureModuleDetail> {
    return createAsset(this.runtime, options);
  }

  public async updateAsset(options: {
    moduleId: string;
    assetSlug: string;
    creatorToken?: string;
    title: string;
    summary: string;
    modifier: string;
    noun: string;
    nounDescription: string;
    adjectiveDescription: string;
    iconUrl: string;
    overlayUrl: string;
    content: string;
  }): Promise<AdventureModuleDetail> {
    return updateAsset(this.runtime, options);
  }

  public async deleteAsset(options: {
    moduleId: string;
    assetSlug: string;
    creatorToken?: string;
  }): Promise<AdventureModuleDetail> {
    return deleteAsset(this.runtime, options);
  }

  public async createCounter(options: {
    moduleId: string;
    creatorToken?: string;
    title: string;
  }): Promise<AdventureModuleDetail> {
    return createCounter(this.runtime, options);
  }

  public async updateCounter(options: {
    moduleId: string;
    counterSlug: string;
    creatorToken?: string;
    title: string;
    iconSlug: AdventureModuleIndex["counters"][number]["iconSlug"];
    currentValue: number;
    maxValue?: number;
    description: string;
  }): Promise<AdventureModuleDetail> {
    return updateCounter(this.runtime, options);
  }

  public async deleteCounter(options: {
    moduleId: string;
    counterSlug: string;
    creatorToken?: string;
  }): Promise<AdventureModuleDetail> {
    return deleteCounter(this.runtime, options);
  }

  public async buildPreview(options: {
    moduleId: string;
    creatorToken?: string;
    showSpoilers?: boolean;
  }): Promise<AdventureModulePreviewResponse> {
    return buildPreview(this.runtime, options);
  }

  public async deleteModule(options: {
    moduleId: string;
    creatorToken?: string;
  }): Promise<void> {
    await deleteModule(this.runtime, options);
  }
}
