import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import {
  campaignDetailSchema,
  campaignListItemSchema,
  campaignSessionDetailSchema,
  type CampaignSessionParticipant,
  type CampaignSessionTableCardReference,
  type CampaignSessionTableTarget,
  campaignSessionSummarySchema,
  type CampaignDetail,
  type CampaignListItem,
  type CampaignSessionDetail,
  type CampaignSessionParticipantRole,
} from "@mighty-decks/spec/campaign";
import type { AdventureModuleIndex } from "@mighty-decks/spec/adventureModule";
import type {
  AdventureModuleCreateActorRequest,
  AdventureModuleUpdateActorRequest,
  AdventureModuleUpdateAssetRequest,
  AdventureModuleUpdateCounterRequest,
  AdventureModuleUpdateCoverImageRequest,
  AdventureModuleUpdateEncounterRequest,
  AdventureModuleUpdateFragmentRequest,
  AdventureModuleUpdateLocationRequest,
  AdventureModuleUpdateQuestRequest,
} from "@mighty-decks/spec/adventureModuleAuthoring";
import { atomicWriteTextFile } from "../utils/atomicFileWrite";
import { AdventureModuleStore } from "./AdventureModuleStore";

const metadataFileName = "campaign.json";
const sessionsFileName = "sessions.json";
const sharedCreatorToken = "campaign-shared-editor";
const previewLimit = 180;

const makeId = (prefix: string): string => {
  const stamp = Date.now().toString(36).slice(-8);
  const noise = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${stamp}${noise}`;
};

const isMissingFileError = (error: unknown): boolean => {
  const nodeError = error as NodeJS.ErrnoException;
  return Boolean(nodeError && typeof nodeError === "object" && nodeError.code === "ENOENT");
};

const summarizeTranscriptText = (text: string | undefined): string | undefined => {
  if (!text) {
    return undefined;
  }
  const normalized = text.trim().replace(/\s+/g, " ");
  if (normalized.length <= previewLimit) {
    return normalized;
  }
  return `${normalized.slice(0, previewLimit - 1)}…`;
};

const countRole = (
  participants: CampaignSessionDetail["participants"],
  role: CampaignSessionParticipantRole,
): number => participants.filter((participant) => participant.role === role).length;

const isStoryteller = (
  participant: CampaignSessionParticipant | undefined,
): boolean => participant?.role === "storyteller";

interface CampaignStoreOptions {
  rootDir: string;
  sourceModuleStore: AdventureModuleStore;
}

interface StoredCampaignMetadata {
  version: 1;
  sourceModuleId: string;
  sourceModuleSlug: string;
  sourceModuleTitle: string;
  createdAtIso: string;
  updatedAtIso: string;
}

const storedCampaignMetadataSchema: z.ZodType<StoredCampaignMetadata> = z.object({
  version: z.literal(1),
  sourceModuleId: z.string().min(1).max(120),
  sourceModuleSlug: z.string().min(1).max(120),
  sourceModuleTitle: z.string().min(1).max(120),
  createdAtIso: z.string().datetime(),
  updatedAtIso: z.string().datetime(),
});

const storedSessionsSchema = z.object({
  sessions: z.array(campaignSessionDetailSchema).max(200).default([]),
});

export class CampaignNotFoundError extends Error {}
export class CampaignSessionNotFoundError extends Error {}
export class CampaignValidationError extends Error {}

export class CampaignStore {
  private readonly rootDir: string;
  private readonly sourceModuleStore: AdventureModuleStore;
  private readonly contentStore: AdventureModuleStore;
  private readonly sessionWriteLocks = new Map<string, Promise<void>>();

  public constructor(options: CampaignStoreOptions) {
    this.rootDir = options.rootDir;
    this.sourceModuleStore = options.sourceModuleStore;
    this.contentStore = new AdventureModuleStore({
      rootDir: options.rootDir,
    });
  }

  public async initialize(): Promise<void> {
    await this.contentStore.initialize();
  }

  public async listCampaigns(): Promise<CampaignListItem[]> {
    const modules = await this.contentStore.listModules(sharedCreatorToken);
    const items = await Promise.all(
      modules.map(async (module) => {
        const metadata = await this.readCampaignMetadata(module.moduleId);
        if (!metadata) {
          return null;
        }
        const sessions = await this.readCampaignSessions(module.moduleId);
        return campaignListItemSchema.parse({
          campaignId: module.moduleId,
          slug: module.slug,
          title: module.title,
          summary: module.summary,
          createdAtIso: metadata.createdAtIso,
          updatedAtIso: this.maxIso(metadata.updatedAtIso, module.updatedAtIso),
          sourceModuleId: metadata.sourceModuleId,
          sourceModuleSlug: metadata.sourceModuleSlug,
          sourceModuleTitle: metadata.sourceModuleTitle,
          coverImageUrl: module.coverImageUrl,
          sessionCount: sessions.length,
          activeSessionCount: sessions.filter((session) => session.status === "active").length,
        });
      }),
    );

    return items
      .filter((item): item is CampaignListItem => item !== null)
      .sort((left, right) => right.updatedAtIso.localeCompare(left.updatedAtIso));
  }

  public async createCampaign(options: {
    sourceModuleId: string;
    title?: string;
    slug?: string;
  }): Promise<CampaignDetail> {
    const source = await this.sourceModuleStore.getModule(options.sourceModuleId);
    if (!source) {
      throw new CampaignNotFoundError("Adventure module not found.");
    }

    const created = await this.contentStore.importModule({
      source,
      creatorToken: sharedCreatorToken,
      title: options.title,
      slug: options.slug,
      status: "draft",
    });
    const nowIso = new Date().toISOString();
    await this.writeCampaignMetadata(created.index.moduleId, {
      version: 1,
      sourceModuleId: source.index.moduleId,
      sourceModuleSlug: source.index.slug,
      sourceModuleTitle: source.index.title,
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
    });
    await this.writeCampaignSessions(created.index.moduleId, []);
    return this.requireCampaign(created.index.moduleId);
  }

  public async getCampaign(campaignId: string): Promise<CampaignDetail | null> {
    const content = await this.contentStore.getModule(campaignId, sharedCreatorToken);
    if (!content) {
      return null;
    }
    const metadata = await this.readCampaignMetadata(campaignId);
    if (!metadata) {
      return null;
    }
    const sessions = await this.readCampaignSessions(campaignId);
    return campaignDetailSchema.parse({
      ...content,
      campaignId,
      sourceModuleId: metadata.sourceModuleId,
      sourceModuleSlug: metadata.sourceModuleSlug,
      sourceModuleTitle: metadata.sourceModuleTitle,
      createdAtIso: metadata.createdAtIso,
      updatedAtIso: this.maxIso(metadata.updatedAtIso, content.index.updatedAtIso),
      sessions: sessions.map((session) => this.summarizeSession(session)),
    });
  }

  public async getCampaignBySlug(slug: string): Promise<CampaignDetail | null> {
    const content = await this.contentStore.getModuleBySlug(slug, sharedCreatorToken);
    if (!content) {
      return null;
    }
    return this.getCampaign(content.index.moduleId);
  }

  public async createSession(options: {
    campaignSlug: string;
  }): Promise<CampaignSessionDetail> {
    const campaign = await this.requireCampaignBySlug(options.campaignSlug);
    const nowIso = new Date().toISOString();
    const session = this.hydrateSession({
      sessionId: makeId("session"),
      status: "setup",
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
      storytellerCount: 0,
      playerCount: 0,
      transcriptEntryCount: 0,
      participants: [],
      claims: [],
      table: [],
      transcript: [
        {
          entryId: makeId("session-entry"),
          kind: "system",
          text: "Session created.",
          createdAtIso: nowIso,
        },
      ],
    });

    await this.withSessionWriteLock(campaign.campaignId, async () => {
      const sessions = await this.readCampaignSessions(campaign.campaignId);
      sessions.push(session);
      await this.writeCampaignSessions(campaign.campaignId, sessions);
      await this.touchCampaignMetadata(campaign.campaignId, nowIso);
    });

    return session;
  }

  public async getSession(options: {
    campaignSlug: string;
    sessionId: string;
  }): Promise<CampaignSessionDetail | null> {
    const campaign = await this.getCampaignBySlug(options.campaignSlug);
    if (!campaign) {
      return null;
    }
    const sessions = await this.readCampaignSessions(campaign.campaignId);
    return sessions.find((session) => session.sessionId === options.sessionId) ?? null;
  }

  public async upsertSessionParticipant(options: {
    campaignSlug: string;
    sessionId: string;
    participantId: string;
    displayName: string;
    role: CampaignSessionParticipantRole;
    isMock?: boolean;
  }): Promise<CampaignSessionDetail> {
    return this.updateSession(options.campaignSlug, options.sessionId, (session, nowIso) => {
      this.assertSessionWritable(session);
      const participant = session.participants.find(
        (candidate) => candidate.participantId === options.participantId,
      );

      if (participant) {
        participant.displayName = options.displayName;
        participant.role = options.role;
        participant.isMock = options.isMock === true;
        participant.connected = true;
        if (participant.role !== "player") {
          session.claims = session.claims.filter(
            (claim) => claim.participantId !== participant.participantId,
          );
        }
      } else {
        session.participants.push({
          participantId: options.participantId,
          displayName: options.displayName,
          role: options.role,
          isMock: options.isMock === true,
          connected: true,
          joinedAtIso: nowIso,
        });
        session.transcript.push({
          entryId: makeId("session-entry"),
          kind: "system",
          text:
            options.isMock === true
              ? `${options.displayName} mock joined as ${options.role}.`
              : `${options.displayName} joined as ${options.role}.`,
          createdAtIso: nowIso,
        });
      }

      if (
        session.status === "setup" &&
        countRole(session.participants, "storyteller") > 0 &&
        countRole(session.participants, "player") > 0
      ) {
        session.status = "active";
        session.transcript.push({
          entryId: makeId("session-entry"),
          kind: "system",
          text: "Session is now active.",
          createdAtIso: nowIso,
        });
      }
    });
  }

  public async claimSessionCharacter(options: {
    campaignSlug: string;
    sessionId: string;
    participantId: string;
    actorFragmentId: string;
  }): Promise<CampaignSessionDetail> {
    const campaign = await this.requireCampaignBySlug(options.campaignSlug);
    const actor = campaign.actors.find((candidate) => candidate.fragmentId === options.actorFragmentId);
    if (!actor) {
      throw new CampaignValidationError("Player character not found in campaign.");
    }
    if (!actor.isPlayerCharacter) {
      throw new CampaignValidationError("Only player characters can be claimed.");
    }

    return this.updateSession(options.campaignSlug, options.sessionId, (session, nowIso) => {
      this.assertSessionWritable(session);
      const participant = session.participants.find(
        (candidate) => candidate.participantId === options.participantId,
      );
      if (!participant) {
        throw new CampaignValidationError("Session participant not found.");
      }
      if (participant.role !== "player") {
        throw new CampaignValidationError("Only players can claim a player character.");
      }

      const currentClaim = session.claims.find(
        (claim) => claim.actorFragmentId === options.actorFragmentId,
      );
      if (currentClaim && currentClaim.participantId !== options.participantId) {
        throw new CampaignValidationError("Player character is already claimed.");
      }
      if (currentClaim && currentClaim.participantId === options.participantId) {
        return;
      }

      session.claims = session.claims.filter(
        (claim) => claim.participantId !== options.participantId,
      );
      session.claims.push({
        actorFragmentId: options.actorFragmentId,
        participantId: options.participantId,
        claimedAtIso: nowIso,
      });
      session.transcript.push({
        entryId: makeId("session-entry"),
        kind: "system",
        text: `${participant.displayName} claimed ${actor.title}.`,
        createdAtIso: nowIso,
      });
    });
  }

  public async removeSessionParticipant(options: {
    campaignSlug: string;
    sessionId: string;
    participantId: string;
  }): Promise<CampaignSessionDetail> {
    return this.updateSession(options.campaignSlug, options.sessionId, (session, nowIso) => {
      const participant = session.participants.find(
        (candidate) => candidate.participantId === options.participantId,
      );
      if (!participant) {
        return;
      }
      participant.connected = false;
      session.claims = session.claims.filter(
        (claim) => claim.participantId !== participant.participantId,
      );
      session.transcript.push({
        entryId: makeId("session-entry"),
        kind: "system",
        text: `${participant.displayName} left the session.`,
        createdAtIso: nowIso,
      });
    });
  }

  public async createSessionPlayerCharacter(options: {
    campaignSlug: string;
    sessionId: string;
    participantId: string;
    title: string;
  }): Promise<CampaignSessionDetail> {
    const campaign = await this.requireCampaignBySlug(options.campaignSlug);
    const beforeActorIds = new Set(campaign.actors.map((actor) => actor.fragmentId));
    const created = await this.contentStore.createActor({
      moduleId: campaign.campaignId,
      creatorToken: sharedCreatorToken,
      title: options.title,
      isPlayerCharacter: true,
    });
    const createdActor = created.actors.find((actor) => !beforeActorIds.has(actor.fragmentId));
    if (!createdActor) {
      throw new CampaignValidationError("Created player character could not be located.");
    }

    await this.touchCampaignMetadata(campaign.campaignId, created.index.updatedAtIso);
    const claimed = await this.claimSessionCharacter({
      campaignSlug: options.campaignSlug,
      sessionId: options.sessionId,
      participantId: options.participantId,
      actorFragmentId: createdActor.fragmentId,
    });

    return this.updateSession(options.campaignSlug, options.sessionId, (session, nowIso) => {
      const participant = session.participants.find(
        (candidate) => candidate.participantId === options.participantId,
      );
      if (!participant) {
        throw new CampaignValidationError("Session participant not found.");
      }
      session.transcript.push({
        entryId: makeId("session-entry"),
        kind: "system",
        text: `${participant.displayName} created ${createdActor.title}.`,
        createdAtIso: nowIso,
      });
    }, claimed);
  }

  public async appendSessionGroupMessage(options: {
    campaignSlug: string;
    sessionId: string;
    participantId: string;
    text: string;
  }): Promise<CampaignSessionDetail> {
    return this.updateSession(options.campaignSlug, options.sessionId, (session, nowIso) => {
      this.assertSessionWritable(session);
      const participant = session.participants.find(
        (candidate) => candidate.participantId === options.participantId,
      );
      if (!participant) {
        throw new CampaignValidationError("Session participant not found.");
      }
      session.transcript.push({
        entryId: makeId("session-entry"),
        kind: "group_message",
        participantId: participant.participantId,
        authorDisplayName: participant.displayName,
        authorRole: participant.role,
        text: options.text.trim(),
        createdAtIso: nowIso,
      });
    });
  }

  public async addSessionTableCards(options: {
    campaignSlug: string;
    sessionId: string;
    participantId: string;
    target: CampaignSessionTableTarget;
    cards: readonly CampaignSessionTableCardReference[];
  }): Promise<CampaignSessionDetail> {
    return this.updateSession(options.campaignSlug, options.sessionId, (session, nowIso) => {
      this.assertSessionWritable(session);
      const participant = session.participants.find(
        (candidate) => candidate.participantId === options.participantId,
      );
      if (!isStoryteller(participant)) {
        throw new CampaignValidationError("Only storytellers can send table cards.");
      }

      if (options.target.scope === "participant") {
        const targetParticipantId = options.target.participantId;
        const targetParticipant = session.participants.find(
          (candidate) => candidate.participantId === targetParticipantId,
        );
        if (!targetParticipant || targetParticipant.role !== "player") {
          throw new CampaignValidationError("Table target must be an active player participant.");
        }
      }

      session.table.push(
        ...options.cards.map((card) => ({
          tableEntryId: makeId("session-table"),
          target: options.target,
          card,
          addedAtIso: nowIso,
        })),
      );
    });
  }

  public async removeSessionTableCard(options: {
    campaignSlug: string;
    sessionId: string;
    participantId: string;
    tableEntryId: string;
  }): Promise<CampaignSessionDetail> {
    return this.updateSession(options.campaignSlug, options.sessionId, (session) => {
      this.assertSessionWritable(session);
      const participant = session.participants.find(
        (candidate) => candidate.participantId === options.participantId,
      );
      if (!participant) {
        throw new CampaignValidationError("Session participant not found.");
      }

      const tableEntry = session.table.find(
        (entry) => entry.tableEntryId === options.tableEntryId,
      );
      if (!tableEntry) {
        throw new CampaignValidationError("Session table card not found.");
      }

      const canRemove =
        participant.role === "storyteller" ||
        (participant.role === "player" &&
          tableEntry.target.scope === "participant" &&
          tableEntry.target.participantId === participant.participantId);

      if (!canRemove) {
        throw new CampaignValidationError("You cannot remove this table card.");
      }

      session.table = session.table.filter(
        (entry) => entry.tableEntryId !== options.tableEntryId,
      );
    });
  }

  public async closeSession(options: {
    campaignSlug: string;
    sessionId: string;
    participantId?: string;
  }): Promise<CampaignSessionDetail> {
    return this.updateSession(options.campaignSlug, options.sessionId, (session, nowIso) => {
      if (session.status === "closed") {
        return;
      }
      if (options.participantId) {
        const participant = session.participants.find(
          (candidate) => candidate.participantId === options.participantId,
        );
        if (!participant || participant.role !== "storyteller") {
          throw new CampaignValidationError("Only a storyteller can close the session.");
        }
      }
      session.status = "closed";
      session.closedAtIso = nowIso;
      session.claims = [];
      session.transcript.push({
        entryId: makeId("session-entry"),
        kind: "system",
        text: "Session closed.",
        createdAtIso: nowIso,
      });
    });
  }

  public async updateIndex(options: {
    campaignId: string;
    index: AdventureModuleIndex;
  }): Promise<CampaignDetail> {
    const updated = await this.contentStore.updateIndex({
      moduleId: options.campaignId,
      creatorToken: sharedCreatorToken,
      index: options.index,
    });
    return this.syncCampaignFromContent(options.campaignId, updated.index.updatedAtIso);
  }

  public async updateFragment(options: {
    campaignId: string;
    fragmentId: string;
    content: AdventureModuleUpdateFragmentRequest["content"];
  }): Promise<CampaignDetail> {
    const updated = await this.contentStore.updateFragment({
      moduleId: options.campaignId,
      fragmentId: options.fragmentId,
      creatorToken: sharedCreatorToken,
      content: options.content,
    });
    return this.syncCampaignFromContent(options.campaignId, updated.index.updatedAtIso);
  }

  public async createLocation(options: {
    campaignId: string;
    title: string;
  }): Promise<CampaignDetail> {
    const updated = await this.contentStore.createLocation({
      moduleId: options.campaignId,
      creatorToken: sharedCreatorToken,
      title: options.title,
    });
    return this.syncCampaignFromContent(options.campaignId, updated.index.updatedAtIso);
  }

  public async updateLocation(options: {
    campaignId: string;
    locationSlug: string;
  } & AdventureModuleUpdateLocationRequest): Promise<CampaignDetail> {
    const updated = await this.contentStore.updateLocation({
      moduleId: options.campaignId,
      locationSlug: options.locationSlug,
      creatorToken: sharedCreatorToken,
      title: options.title,
      summary: options.summary,
      titleImageUrl: options.titleImageUrl ?? undefined,
      introductionMarkdown: options.introductionMarkdown,
      descriptionMarkdown: options.descriptionMarkdown,
      mapImageUrl: options.mapImageUrl ?? undefined,
      mapPins: options.mapPins,
    });
    return this.syncCampaignFromContent(options.campaignId, updated.index.updatedAtIso);
  }

  public async deleteLocation(options: {
    campaignId: string;
    locationSlug: string;
  }): Promise<CampaignDetail> {
    const updated = await this.contentStore.deleteLocation({
      moduleId: options.campaignId,
      locationSlug: options.locationSlug,
      creatorToken: sharedCreatorToken,
    });
    return this.syncCampaignFromContent(options.campaignId, updated.index.updatedAtIso);
  }

  public async createEncounter(options: {
    campaignId: string;
    title: string;
  }): Promise<CampaignDetail> {
    const updated = await this.contentStore.createEncounter({
      moduleId: options.campaignId,
      creatorToken: sharedCreatorToken,
      title: options.title,
    });
    return this.syncCampaignFromContent(options.campaignId, updated.index.updatedAtIso);
  }

  public async updateEncounter(options: {
    campaignId: string;
    encounterSlug: string;
  } & AdventureModuleUpdateEncounterRequest): Promise<CampaignDetail> {
    const updated = await this.contentStore.updateEncounter({
      moduleId: options.campaignId,
      encounterSlug: options.encounterSlug,
      creatorToken: sharedCreatorToken,
      title: options.title,
      summary: options.summary,
      prerequisites: options.prerequisites,
      titleImageUrl: options.titleImageUrl ?? undefined,
      content: options.content,
    });
    return this.syncCampaignFromContent(options.campaignId, updated.index.updatedAtIso);
  }

  public async deleteEncounter(options: {
    campaignId: string;
    encounterSlug: string;
  }): Promise<CampaignDetail> {
    const updated = await this.contentStore.deleteEncounter({
      moduleId: options.campaignId,
      encounterSlug: options.encounterSlug,
      creatorToken: sharedCreatorToken,
    });
    return this.syncCampaignFromContent(options.campaignId, updated.index.updatedAtIso);
  }

  public async createQuest(options: {
    campaignId: string;
    title: string;
  }): Promise<CampaignDetail> {
    const updated = await this.contentStore.createQuest({
      moduleId: options.campaignId,
      creatorToken: sharedCreatorToken,
      title: options.title,
    });
    return this.syncCampaignFromContent(options.campaignId, updated.index.updatedAtIso);
  }

  public async updateQuest(options: {
    campaignId: string;
    questSlug: string;
  } & AdventureModuleUpdateQuestRequest): Promise<CampaignDetail> {
    const updated = await this.contentStore.updateQuest({
      moduleId: options.campaignId,
      questSlug: options.questSlug,
      creatorToken: sharedCreatorToken,
      title: options.title,
      summary: options.summary,
      titleImageUrl: options.titleImageUrl ?? undefined,
      content: options.content,
    });
    return this.syncCampaignFromContent(options.campaignId, updated.index.updatedAtIso);
  }

  public async deleteQuest(options: {
    campaignId: string;
    questSlug: string;
  }): Promise<CampaignDetail> {
    const updated = await this.contentStore.deleteQuest({
      moduleId: options.campaignId,
      questSlug: options.questSlug,
      creatorToken: sharedCreatorToken,
    });
    return this.syncCampaignFromContent(options.campaignId, updated.index.updatedAtIso);
  }

  public async createActor(options: {
    campaignId: string;
  } & AdventureModuleCreateActorRequest): Promise<CampaignDetail> {
    const updated = await this.contentStore.createActor({
      moduleId: options.campaignId,
      creatorToken: sharedCreatorToken,
      title: options.title,
      isPlayerCharacter: options.isPlayerCharacter,
    });
    return this.syncCampaignFromContent(options.campaignId, updated.index.updatedAtIso);
  }

  public async updateActor(options: {
    campaignId: string;
    actorSlug: string;
  } & AdventureModuleUpdateActorRequest): Promise<CampaignDetail> {
    const updated = await this.contentStore.updateActor({
      moduleId: options.campaignId,
      actorSlug: options.actorSlug,
      creatorToken: sharedCreatorToken,
      title: options.title,
      summary: options.summary,
      baseLayerSlug: options.baseLayerSlug,
      tacticalRoleSlug: options.tacticalRoleSlug,
      tacticalSpecialSlug:
        options.tacticalSpecialSlug === null ? undefined : options.tacticalSpecialSlug,
      isPlayerCharacter: options.isPlayerCharacter,
      content: options.content,
    });
    return this.syncCampaignFromContent(options.campaignId, updated.index.updatedAtIso);
  }

  public async deleteActor(options: {
    campaignId: string;
    actorSlug: string;
  }): Promise<CampaignDetail> {
    const updated = await this.contentStore.deleteActor({
      moduleId: options.campaignId,
      actorSlug: options.actorSlug,
      creatorToken: sharedCreatorToken,
    });
    return this.syncCampaignFromContent(options.campaignId, updated.index.updatedAtIso);
  }

  public async createAsset(options: {
    campaignId: string;
    title: string;
  }): Promise<CampaignDetail> {
    const updated = await this.contentStore.createAsset({
      moduleId: options.campaignId,
      creatorToken: sharedCreatorToken,
      title: options.title,
    });
    return this.syncCampaignFromContent(options.campaignId, updated.index.updatedAtIso);
  }

  public async updateAsset(options: {
    campaignId: string;
    assetSlug: string;
  } & AdventureModuleUpdateAssetRequest): Promise<CampaignDetail> {
    const updated = await this.contentStore.updateAsset({
      moduleId: options.campaignId,
      assetSlug: options.assetSlug,
      creatorToken: sharedCreatorToken,
      title: options.title,
      summary: options.summary,
      modifier: options.modifier,
      noun: options.noun,
      nounDescription: options.nounDescription,
      adjectiveDescription: options.adjectiveDescription,
      iconUrl: options.iconUrl,
      overlayUrl: options.overlayUrl,
      content: options.content,
    });
    return this.syncCampaignFromContent(options.campaignId, updated.index.updatedAtIso);
  }

  public async deleteAsset(options: {
    campaignId: string;
    assetSlug: string;
  }): Promise<CampaignDetail> {
    const updated = await this.contentStore.deleteAsset({
      moduleId: options.campaignId,
      assetSlug: options.assetSlug,
      creatorToken: sharedCreatorToken,
    });
    return this.syncCampaignFromContent(options.campaignId, updated.index.updatedAtIso);
  }

  public async createCounter(options: {
    campaignId: string;
    title: string;
  }): Promise<CampaignDetail> {
    const updated = await this.contentStore.createCounter({
      moduleId: options.campaignId,
      creatorToken: sharedCreatorToken,
      title: options.title,
    });
    return this.syncCampaignFromContent(options.campaignId, updated.index.updatedAtIso);
  }

  public async updateCounter(options: {
    campaignId: string;
    counterSlug: string;
  } & AdventureModuleUpdateCounterRequest): Promise<CampaignDetail> {
    const updated = await this.contentStore.updateCounter({
      moduleId: options.campaignId,
      counterSlug: options.counterSlug,
      creatorToken: sharedCreatorToken,
      title: options.title,
      iconSlug: options.iconSlug,
      currentValue: options.currentValue,
      maxValue: options.maxValue ?? undefined,
      description: options.description,
    });
    return this.syncCampaignFromContent(options.campaignId, updated.index.updatedAtIso);
  }

  public async deleteCounter(options: {
    campaignId: string;
    counterSlug: string;
  }): Promise<CampaignDetail> {
    const updated = await this.contentStore.deleteCounter({
      moduleId: options.campaignId,
      counterSlug: options.counterSlug,
      creatorToken: sharedCreatorToken,
    });
    return this.syncCampaignFromContent(options.campaignId, updated.index.updatedAtIso);
  }

  public async updateCoverImage(options: {
    campaignId: string;
  } & AdventureModuleUpdateCoverImageRequest): Promise<CampaignDetail> {
    const updated = await this.contentStore.updateCoverImage({
      moduleId: options.campaignId,
      creatorToken: sharedCreatorToken,
      coverImageUrl: options.coverImageUrl ?? undefined,
    });
    return this.syncCampaignFromContent(options.campaignId, updated.index.updatedAtIso);
  }

  private async syncCampaignFromContent(
    campaignId: string,
    updatedAtIso: string,
  ): Promise<CampaignDetail> {
    await this.touchCampaignMetadata(campaignId, updatedAtIso);
    return this.requireCampaign(campaignId);
  }

  private async requireCampaign(campaignId: string): Promise<CampaignDetail> {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) {
      throw new CampaignNotFoundError("Campaign not found.");
    }
    return campaign;
  }

  private async requireCampaignBySlug(slug: string): Promise<CampaignDetail> {
    const campaign = await this.getCampaignBySlug(slug);
    if (!campaign) {
      throw new CampaignNotFoundError("Campaign not found.");
    }
    return campaign;
  }

  private async updateSession(
    campaignSlug: string,
    sessionId: string,
    mutate: (session: CampaignSessionDetail, nowIso: string) => void,
    seed?: CampaignSessionDetail,
  ): Promise<CampaignSessionDetail> {
    const campaign = await this.requireCampaignBySlug(campaignSlug);
    return this.withSessionWriteLock(campaign.campaignId, async () => {
      const sessions = await this.readCampaignSessions(campaign.campaignId);
      const seedSession = seed ?? sessions.find((candidate) => candidate.sessionId === sessionId);
      if (!seedSession) {
        throw new CampaignSessionNotFoundError("Campaign session not found.");
      }
      const session = structuredClone(seedSession);
      const nowIso = new Date().toISOString();
      mutate(session, nowIso);
      session.updatedAtIso = nowIso;
      const hydrated = this.hydrateSession(session);
      const nextSessions = sessions.map((candidate) =>
        candidate.sessionId === hydrated.sessionId ? hydrated : candidate,
      );
      await this.writeCampaignSessions(campaign.campaignId, nextSessions);
      await this.touchCampaignMetadata(campaign.campaignId, nowIso);
      return hydrated;
    });
  }

  private assertSessionWritable(session: CampaignSessionDetail): void {
    if (session.status === "closed") {
      throw new CampaignValidationError("Closed sessions cannot be modified.");
    }
  }

  private hydrateSession(session: CampaignSessionDetail): CampaignSessionDetail {
    return campaignSessionDetailSchema.parse({
      ...session,
      storytellerCount: countRole(session.participants, "storyteller"),
      playerCount: countRole(session.participants, "player"),
      transcriptEntryCount: session.transcript.length,
      transcriptPreview: summarizeTranscriptText(session.transcript.at(-1)?.text),
    });
  }

  private summarizeSession(session: CampaignSessionDetail) {
    return campaignSessionSummarySchema.parse({
      sessionId: session.sessionId,
      status: session.status,
      createdAtIso: session.createdAtIso,
      updatedAtIso: session.updatedAtIso,
      closedAtIso: session.closedAtIso,
      storytellerCount: session.storytellerCount,
      playerCount: session.playerCount,
      transcriptEntryCount: session.transcriptEntryCount,
      transcriptPreview: session.transcriptPreview,
    });
  }

  private async withSessionWriteLock<T>(
    campaignId: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    let releaseLock: () => void = () => {};
    const currentLock = this.sessionWriteLocks.get(campaignId) ?? Promise.resolve();
    const nextLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    this.sessionWriteLocks.set(campaignId, nextLock);

    await currentLock.catch(() => undefined);
    try {
      return await operation();
    } finally {
      releaseLock();
      if (this.sessionWriteLocks.get(campaignId) === nextLock) {
        this.sessionWriteLocks.delete(campaignId);
      }
    }
  }

  private async readCampaignMetadata(
    campaignId: string,
  ): Promise<StoredCampaignMetadata | null> {
    const path = this.resolveCampaignPath(campaignId, metadataFileName);
    try {
      const raw = await readFile(path, "utf8");
      return storedCampaignMetadataSchema.parse(JSON.parse(raw));
    } catch (error) {
      if (isMissingFileError(error)) {
        return null;
      }
      throw error;
    }
  }

  private async writeCampaignMetadata(
    campaignId: string,
    metadata: StoredCampaignMetadata,
  ): Promise<void> {
    const path = this.resolveCampaignPath(campaignId, metadataFileName);
    await mkdir(resolve(path, ".."), { recursive: true });
    await atomicWriteTextFile(path, JSON.stringify(metadata, null, 2));
  }

  private async touchCampaignMetadata(
    campaignId: string,
    updatedAtIso: string,
  ): Promise<void> {
    const metadata = await this.readCampaignMetadata(campaignId);
    if (!metadata) {
      throw new CampaignNotFoundError("Campaign metadata not found.");
    }
    await this.writeCampaignMetadata(campaignId, {
      ...metadata,
      updatedAtIso,
    });
  }

  private async readCampaignSessions(campaignId: string): Promise<CampaignSessionDetail[]> {
    const path = this.resolveCampaignPath(campaignId, sessionsFileName);
    try {
      const raw = await readFile(path, "utf8");
      return storedSessionsSchema
        .parse(JSON.parse(raw))
        .sessions.map((session) => this.hydrateSession(session))
        .sort((left, right) => right.createdAtIso.localeCompare(left.createdAtIso));
    } catch (error) {
      if (isMissingFileError(error)) {
        return [];
      }
      throw error;
    }
  }

  private async writeCampaignSessions(
    campaignId: string,
    sessions: CampaignSessionDetail[],
  ): Promise<void> {
    const path = this.resolveCampaignPath(campaignId, sessionsFileName);
    await mkdir(resolve(path, ".."), { recursive: true });
    await atomicWriteTextFile(
      path,
      JSON.stringify(
        storedSessionsSchema.parse({
          sessions: sessions.map((session) => this.hydrateSession(session)),
        }),
        null,
        2,
      ),
    );
  }

  private resolveCampaignPath(campaignId: string, fileName: string): string {
    return resolve(this.rootDir, campaignId, fileName);
  }

  private maxIso(left: string, right: string): string {
    return left.localeCompare(right) >= 0 ? left : right;
  }
}
