import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import {
  campaignBySlugParamsSchema,
  campaignCreateRequestSchema,
  campaignCreateResponseSchema,
  campaignCreateSessionRequestSchema,
  campaignErrorSchema,
  campaignGetResponseSchema,
  campaignListResponseSchema,
  campaignListSessionsResponseSchema,
  campaignSessionParamsSchema,
  campaignSessionResponseSchema,
} from "@mighty-decks/spec/campaign";
import {
  adventureModuleCreateActorRequestSchema,
  adventureModuleCreateAssetRequestSchema,
  adventureModuleCreateCounterRequestSchema,
  adventureModuleCreateEncounterRequestSchema,
  adventureModuleCreateLocationRequestSchema,
  adventureModuleCreateQuestRequestSchema,
  adventureModuleUpdateActorRequestSchema,
  adventureModuleUpdateAssetRequestSchema,
  adventureModuleUpdateCounterRequestSchema,
  adventureModuleUpdateCoverImageRequestSchema,
  adventureModuleUpdateEncounterRequestSchema,
  adventureModuleUpdateFragmentRequestSchema,
  adventureModuleUpdateIndexRequestSchema,
  adventureModuleUpdateLocationRequestSchema,
  adventureModuleUpdateQuestRequestSchema,
} from "@mighty-decks/spec/adventureModuleAuthoring";
import {
  CampaignNotFoundError,
  CampaignSessionNotFoundError,
  CampaignStore,
  CampaignValidationError,
} from "../persistence/CampaignStore";

interface RegisterCampaignRoutesOptions {
  store: CampaignStore;
  onCampaignUpdated?: (payload: { campaignSlug: string; updatedAtIso: string }) => void;
}

const campaignIdParamsSchema = z.object({
  campaignId: z.string().min(1).max(120),
});
const entitySlugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase kebab-case");
const actorSlugParamsSchema = z.object({
  actorSlug: entitySlugSchema,
});
const assetSlugParamsSchema = z.object({
  assetSlug: entitySlugSchema,
});
const counterSlugParamsSchema = z.object({
  counterSlug: entitySlugSchema,
});
const locationSlugParamsSchema = z.object({
  locationSlug: entitySlugSchema,
});
const encounterSlugParamsSchema = z.object({
  encounterSlug: entitySlugSchema,
});
const questSlugParamsSchema = z.object({
  questSlug: entitySlugSchema,
});

const sendError = (reply: FastifyReply, statusCode: number, message: string) =>
  reply.code(statusCode).send(campaignErrorSchema.parse({ message }));

const sendKnownError = (reply: FastifyReply, error: unknown): FastifyReply => {
  if (error instanceof CampaignNotFoundError) {
    return sendError(reply, 404, error.message);
  }
  if (error instanceof CampaignSessionNotFoundError) {
    return sendError(reply, 404, error.message);
  }
  if (error instanceof CampaignValidationError) {
    return sendError(reply, 400, error.message);
  }
  if (error instanceof Error) {
    return sendError(reply, 400, error.message);
  }
  return sendError(reply, 400, "Request failed.");
};

const notifyCampaignUpdated = (
  options: RegisterCampaignRoutesOptions,
  campaignSlug: string,
  updatedAtIso: string,
): void => {
  options.onCampaignUpdated?.({
    campaignSlug,
    updatedAtIso,
  });
};

export const registerCampaignRoutes = (
  app: FastifyInstance,
  options: RegisterCampaignRoutesOptions,
): void => {
  app.get("/api/campaigns", async (_request, reply) => {
    const campaigns = await options.store.listCampaigns();
    return reply.send(campaignListResponseSchema.parse({ campaigns }));
  });

  app.post("/api/campaigns", async (request, reply) => {
    try {
      const payload = campaignCreateRequestSchema.parse(request.body);
      const created = await options.store.createCampaign({
        sourceModuleId: payload.sourceModuleId,
        title: payload.title,
        slug: payload.slug,
      });
      notifyCampaignUpdated(options, created.index.slug, created.updatedAtIso);
      return reply.code(201).send(campaignCreateResponseSchema.parse(created));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.get("/api/campaigns/by-slug/:slug", async (request, reply) => {
    try {
      const params = campaignBySlugParamsSchema.parse(request.params ?? {});
      const campaign = await options.store.getCampaignBySlug(params.slug);
      if (!campaign) {
        return sendError(reply, 404, "Campaign not found.");
      }
      return reply.send(campaignGetResponseSchema.parse(campaign));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.put("/api/campaigns/:campaignId/index", async (request, reply) => {
    try {
      const params = campaignIdParamsSchema.parse(request.params ?? {});
      const payload = adventureModuleUpdateIndexRequestSchema.parse(request.body);
      const updated = await options.store.updateIndex({
        campaignId: params.campaignId,
        index: payload.index,
      });
      notifyCampaignUpdated(options, updated.index.slug, updated.updatedAtIso);
      return reply.send(campaignGetResponseSchema.parse(updated));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.put("/api/campaigns/:campaignId/fragments/:fragmentId", async (request, reply) => {
    try {
      const params = campaignIdParamsSchema.parse(request.params ?? {});
      const { fragmentId = "" } = request.params as { fragmentId?: string };
      const payload = adventureModuleUpdateFragmentRequestSchema.parse(request.body);
      const updated = await options.store.updateFragment({
        campaignId: params.campaignId,
        fragmentId,
        content: payload.content,
      });
      notifyCampaignUpdated(options, updated.index.slug, updated.updatedAtIso);
      return reply.send(campaignGetResponseSchema.parse(updated));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.post("/api/campaigns/:campaignId/locations", async (request, reply) => {
    try {
      const params = campaignIdParamsSchema.parse(request.params ?? {});
      const payload = adventureModuleCreateLocationRequestSchema.parse(request.body);
      const updated = await options.store.createLocation({
        campaignId: params.campaignId,
        title: payload.title,
      });
      notifyCampaignUpdated(options, updated.index.slug, updated.updatedAtIso);
      return reply.code(201).send(campaignCreateResponseSchema.parse(updated));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.put("/api/campaigns/:campaignId/locations/:locationSlug", async (request, reply) => {
    try {
      const params = campaignIdParamsSchema.parse(request.params ?? {});
      const routeParams = locationSlugParamsSchema.parse(request.params ?? {});
      const payload = adventureModuleUpdateLocationRequestSchema.parse(request.body);
      const updated = await options.store.updateLocation({
        campaignId: params.campaignId,
        locationSlug: routeParams.locationSlug,
        title: payload.title,
        summary: payload.summary,
        titleImageUrl: payload.titleImageUrl ?? undefined,
        introductionMarkdown: payload.introductionMarkdown,
        descriptionMarkdown: payload.descriptionMarkdown,
        mapImageUrl: payload.mapImageUrl ?? undefined,
        mapPins: payload.mapPins,
      });
      notifyCampaignUpdated(options, updated.index.slug, updated.updatedAtIso);
      return reply.send(campaignGetResponseSchema.parse(updated));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.delete("/api/campaigns/:campaignId/locations/:locationSlug", async (request, reply) => {
    try {
      const params = campaignIdParamsSchema.parse(request.params ?? {});
      const routeParams = locationSlugParamsSchema.parse(request.params ?? {});
      const updated = await options.store.deleteLocation({
        campaignId: params.campaignId,
        locationSlug: routeParams.locationSlug,
      });
      notifyCampaignUpdated(options, updated.index.slug, updated.updatedAtIso);
      return reply.send(campaignGetResponseSchema.parse(updated));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.post("/api/campaigns/:campaignId/encounters", async (request, reply) => {
    try {
      const params = campaignIdParamsSchema.parse(request.params ?? {});
      const payload = adventureModuleCreateEncounterRequestSchema.parse(request.body);
      const updated = await options.store.createEncounter({
        campaignId: params.campaignId,
        title: payload.title,
      });
      notifyCampaignUpdated(options, updated.index.slug, updated.updatedAtIso);
      return reply.code(201).send(campaignCreateResponseSchema.parse(updated));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.put("/api/campaigns/:campaignId/encounters/:encounterSlug", async (request, reply) => {
    try {
      const params = campaignIdParamsSchema.parse(request.params ?? {});
      const routeParams = encounterSlugParamsSchema.parse(request.params ?? {});
      const payload = adventureModuleUpdateEncounterRequestSchema.parse(request.body);
      const updated = await options.store.updateEncounter({
        campaignId: params.campaignId,
        encounterSlug: routeParams.encounterSlug,
        title: payload.title,
        summary: payload.summary,
        prerequisites: payload.prerequisites,
        titleImageUrl: payload.titleImageUrl ?? undefined,
        content: payload.content,
      });
      notifyCampaignUpdated(options, updated.index.slug, updated.updatedAtIso);
      return reply.send(campaignGetResponseSchema.parse(updated));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.delete("/api/campaigns/:campaignId/encounters/:encounterSlug", async (request, reply) => {
    try {
      const params = campaignIdParamsSchema.parse(request.params ?? {});
      const routeParams = encounterSlugParamsSchema.parse(request.params ?? {});
      const updated = await options.store.deleteEncounter({
        campaignId: params.campaignId,
        encounterSlug: routeParams.encounterSlug,
      });
      notifyCampaignUpdated(options, updated.index.slug, updated.updatedAtIso);
      return reply.send(campaignGetResponseSchema.parse(updated));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.post("/api/campaigns/:campaignId/quests", async (request, reply) => {
    try {
      const params = campaignIdParamsSchema.parse(request.params ?? {});
      const payload = adventureModuleCreateQuestRequestSchema.parse(request.body);
      const updated = await options.store.createQuest({
        campaignId: params.campaignId,
        title: payload.title,
      });
      notifyCampaignUpdated(options, updated.index.slug, updated.updatedAtIso);
      return reply.code(201).send(campaignCreateResponseSchema.parse(updated));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.put("/api/campaigns/:campaignId/quests/:questSlug", async (request, reply) => {
    try {
      const params = campaignIdParamsSchema.parse(request.params ?? {});
      const routeParams = questSlugParamsSchema.parse(request.params ?? {});
      const payload = adventureModuleUpdateQuestRequestSchema.parse(request.body);
      const updated = await options.store.updateQuest({
        campaignId: params.campaignId,
        questSlug: routeParams.questSlug,
        title: payload.title,
        summary: payload.summary,
        titleImageUrl: payload.titleImageUrl ?? undefined,
        content: payload.content,
      });
      notifyCampaignUpdated(options, updated.index.slug, updated.updatedAtIso);
      return reply.send(campaignGetResponseSchema.parse(updated));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.delete("/api/campaigns/:campaignId/quests/:questSlug", async (request, reply) => {
    try {
      const params = campaignIdParamsSchema.parse(request.params ?? {});
      const routeParams = questSlugParamsSchema.parse(request.params ?? {});
      const updated = await options.store.deleteQuest({
        campaignId: params.campaignId,
        questSlug: routeParams.questSlug,
      });
      notifyCampaignUpdated(options, updated.index.slug, updated.updatedAtIso);
      return reply.send(campaignGetResponseSchema.parse(updated));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.post("/api/campaigns/:campaignId/actors", async (request, reply) => {
    try {
      const params = campaignIdParamsSchema.parse(request.params ?? {});
      const payload = adventureModuleCreateActorRequestSchema.parse(request.body);
      const updated = await options.store.createActor({
        campaignId: params.campaignId,
        title: payload.title,
        isPlayerCharacter: payload.isPlayerCharacter,
      });
      notifyCampaignUpdated(options, updated.index.slug, updated.updatedAtIso);
      return reply.code(201).send(campaignCreateResponseSchema.parse(updated));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.put("/api/campaigns/:campaignId/actors/:actorSlug", async (request, reply) => {
    try {
      const params = campaignIdParamsSchema.parse(request.params ?? {});
      const routeParams = actorSlugParamsSchema.parse(request.params ?? {});
      const payload = adventureModuleUpdateActorRequestSchema.parse(request.body);
      const updated = await options.store.updateActor({
        campaignId: params.campaignId,
        actorSlug: routeParams.actorSlug,
        title: payload.title,
        summary: payload.summary,
        baseLayerSlug: payload.baseLayerSlug,
        tacticalRoleSlug: payload.tacticalRoleSlug,
        tacticalSpecialSlug:
          payload.tacticalSpecialSlug === null ? undefined : payload.tacticalSpecialSlug,
        isPlayerCharacter: payload.isPlayerCharacter,
        content: payload.content,
      });
      notifyCampaignUpdated(options, updated.index.slug, updated.updatedAtIso);
      return reply.send(campaignGetResponseSchema.parse(updated));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.delete("/api/campaigns/:campaignId/actors/:actorSlug", async (request, reply) => {
    try {
      const params = campaignIdParamsSchema.parse(request.params ?? {});
      const routeParams = actorSlugParamsSchema.parse(request.params ?? {});
      const updated = await options.store.deleteActor({
        campaignId: params.campaignId,
        actorSlug: routeParams.actorSlug,
      });
      notifyCampaignUpdated(options, updated.index.slug, updated.updatedAtIso);
      return reply.send(campaignGetResponseSchema.parse(updated));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.post("/api/campaigns/:campaignId/assets", async (request, reply) => {
    try {
      const params = campaignIdParamsSchema.parse(request.params ?? {});
      const payload = adventureModuleCreateAssetRequestSchema.parse(request.body);
      const updated = await options.store.createAsset({
        campaignId: params.campaignId,
        title: payload.title,
      });
      notifyCampaignUpdated(options, updated.index.slug, updated.updatedAtIso);
      return reply.code(201).send(campaignCreateResponseSchema.parse(updated));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.put("/api/campaigns/:campaignId/assets/:assetSlug", async (request, reply) => {
    try {
      const params = campaignIdParamsSchema.parse(request.params ?? {});
      const routeParams = assetSlugParamsSchema.parse(request.params ?? {});
      const payload = adventureModuleUpdateAssetRequestSchema.parse(request.body);
      const updated = await options.store.updateAsset({
        campaignId: params.campaignId,
        assetSlug: routeParams.assetSlug,
        title: payload.title,
        summary: payload.summary,
        modifier: payload.modifier,
        noun: payload.noun,
        nounDescription: payload.nounDescription,
        adjectiveDescription: payload.adjectiveDescription,
        iconUrl: payload.iconUrl,
        overlayUrl: payload.overlayUrl,
        content: payload.content,
      });
      notifyCampaignUpdated(options, updated.index.slug, updated.updatedAtIso);
      return reply.send(campaignGetResponseSchema.parse(updated));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.delete("/api/campaigns/:campaignId/assets/:assetSlug", async (request, reply) => {
    try {
      const params = campaignIdParamsSchema.parse(request.params ?? {});
      const routeParams = assetSlugParamsSchema.parse(request.params ?? {});
      const updated = await options.store.deleteAsset({
        campaignId: params.campaignId,
        assetSlug: routeParams.assetSlug,
      });
      notifyCampaignUpdated(options, updated.index.slug, updated.updatedAtIso);
      return reply.send(campaignGetResponseSchema.parse(updated));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.post("/api/campaigns/:campaignId/counters", async (request, reply) => {
    try {
      const params = campaignIdParamsSchema.parse(request.params ?? {});
      const payload = adventureModuleCreateCounterRequestSchema.parse(request.body);
      const updated = await options.store.createCounter({
        campaignId: params.campaignId,
        title: payload.title,
      });
      notifyCampaignUpdated(options, updated.index.slug, updated.updatedAtIso);
      return reply.code(201).send(campaignCreateResponseSchema.parse(updated));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.put("/api/campaigns/:campaignId/counters/:counterSlug", async (request, reply) => {
    try {
      const params = campaignIdParamsSchema.parse(request.params ?? {});
      const routeParams = counterSlugParamsSchema.parse(request.params ?? {});
      const payload = adventureModuleUpdateCounterRequestSchema.parse(request.body);
      const updated = await options.store.updateCounter({
        campaignId: params.campaignId,
        counterSlug: routeParams.counterSlug,
        title: payload.title,
        iconSlug: payload.iconSlug,
        currentValue: payload.currentValue,
        maxValue: payload.maxValue ?? undefined,
        description: payload.description,
      });
      notifyCampaignUpdated(options, updated.index.slug, updated.updatedAtIso);
      return reply.send(campaignGetResponseSchema.parse(updated));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.delete("/api/campaigns/:campaignId/counters/:counterSlug", async (request, reply) => {
    try {
      const params = campaignIdParamsSchema.parse(request.params ?? {});
      const routeParams = counterSlugParamsSchema.parse(request.params ?? {});
      const updated = await options.store.deleteCounter({
        campaignId: params.campaignId,
        counterSlug: routeParams.counterSlug,
      });
      notifyCampaignUpdated(options, updated.index.slug, updated.updatedAtIso);
      return reply.send(campaignGetResponseSchema.parse(updated));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.put("/api/campaigns/:campaignId/cover-image", async (request, reply) => {
    try {
      const params = campaignIdParamsSchema.parse(request.params ?? {});
      const payload = adventureModuleUpdateCoverImageRequestSchema.parse(request.body);
      const updated = await options.store.updateCoverImage({
        campaignId: params.campaignId,
        coverImageUrl: payload.coverImageUrl ?? undefined,
      });
      notifyCampaignUpdated(options, updated.index.slug, updated.updatedAtIso);
      return reply.send(campaignGetResponseSchema.parse(updated));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.post("/api/campaigns/:campaignId/sessions", async (request, reply) => {
    try {
      const params = campaignIdParamsSchema.parse(request.params ?? {});
      campaignCreateSessionRequestSchema.parse(request.body ?? {});
      const campaign = await options.store.getCampaign(params.campaignId);
      if (!campaign) {
        return sendError(reply, 404, "Campaign not found.");
      }
      const created = await options.store.createSession({
        campaignSlug: campaign.index.slug,
      });
      notifyCampaignUpdated(options, campaign.index.slug, created.updatedAtIso);
      return reply.code(201).send(campaignSessionResponseSchema.parse(created));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.get("/api/campaigns/by-slug/:slug/sessions", async (request, reply) => {
    try {
      const params = campaignBySlugParamsSchema.parse(request.params ?? {});
      const campaign = await options.store.getCampaignBySlug(params.slug);
      if (!campaign) {
        return sendError(reply, 404, "Campaign not found.");
      }
      return reply.send(
        campaignListSessionsResponseSchema.parse({
          sessions: campaign.sessions,
        }),
      );
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.get("/api/campaigns/by-slug/:slug/sessions/:sessionId", async (request, reply) => {
    try {
      const params = campaignSessionParamsSchema.parse(request.params ?? {});
      const session = await options.store.getSession({
        campaignSlug: params.slug,
        sessionId: params.sessionId,
      });
      if (!session) {
        return sendError(reply, 404, "Campaign session not found.");
      }
      return reply.send(campaignSessionResponseSchema.parse(session));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });
};
