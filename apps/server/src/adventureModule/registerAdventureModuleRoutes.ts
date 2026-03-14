import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  adventureModuleBySlugParamsSchema,
  adventureModuleCreateActorRequestSchema,
  adventureModuleCloneRequestSchema,
  adventureModuleCreateRequestSchema,
  adventureModuleCreateResponseSchema,
  adventureModuleErrorSchema,
  adventureModuleGetResponseSchema,
  adventureModuleListResponseSchema,
  adventureModulePreviewQuerySchema,
  adventureModulePreviewResponseSchema,
  adventureModuleSlugAvailabilityQuerySchema,
  adventureModuleSlugAvailabilityResponseSchema,
  adventureModuleUpdateFragmentRequestSchema,
  adventureModuleUpdateActorRequestSchema,
  adventureModuleUpdateActorResponseSchema,
  adventureModuleUpdateCoverImageRequestSchema,
  adventureModuleUpdateIndexRequestSchema,
  adventureModuleUpdateResponseSchema,
} from "@mighty-decks/spec/adventureModuleAuthoring";
import {
  AdventureModuleForbiddenError,
  AdventureModuleNotFoundError,
  AdventureModuleStore,
  AdventureModuleValidationError,
} from "../persistence/AdventureModuleStore";

interface RegisterAdventureModuleRoutesOptions {
  store: AdventureModuleStore;
}

const CREATOR_TOKEN_HEADER = "x-md-module-creator-token";
const actorSlugParamsSchema = z.object({
  actorSlug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "actor slug must be lowercase kebab-case"),
});

const parseCreatorToken = (request: FastifyRequest): string | undefined => {
  const headerValue = request.headers[CREATOR_TOKEN_HEADER];
  if (Array.isArray(headerValue)) {
    return headerValue[0]?.trim() || undefined;
  }
  if (typeof headerValue === "string") {
    const trimmed = headerValue.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
};

const sendError = (reply: FastifyReply, statusCode: number, message: string) =>
  reply.code(statusCode).send(adventureModuleErrorSchema.parse({ message }));

const sendKnownError = (reply: FastifyReply, error: unknown): FastifyReply => {
  if (error instanceof AdventureModuleNotFoundError) {
    return sendError(reply, 404, error.message);
  }
  if (error instanceof AdventureModuleForbiddenError) {
    return sendError(reply, 403, error.message);
  }
  if (error instanceof AdventureModuleValidationError) {
    return sendError(reply, 400, error.message);
  }
  if (error instanceof Error) {
    return sendError(reply, 400, error.message);
  }
  return sendError(reply, 400, "Request failed.");
};

export const registerAdventureModuleRoutes = (
  app: FastifyInstance,
  options: RegisterAdventureModuleRoutesOptions,
): void => {
  app.get("/api/adventure-modules", async (request, reply) => {
    const creatorToken = parseCreatorToken(request);
    const modules = await options.store.listModules(creatorToken);
    return reply.send(adventureModuleListResponseSchema.parse({ modules }));
  });

  app.get("/api/adventure-modules/slug-availability", async (request, reply) => {
    try {
      const query = adventureModuleSlugAvailabilityQuerySchema.parse(
        request.query ?? {},
      );
      const result = await options.store.checkSlugAvailability({ slug: query.slug });
      return reply.send(
        adventureModuleSlugAvailabilityResponseSchema.parse({
          slug: query.slug,
          available: result.available,
          reason: result.reason,
        }),
      );
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.post("/api/adventure-modules", async (request, reply) => {
    const creatorToken = parseCreatorToken(request);
    try {
      const payload = adventureModuleCreateRequestSchema.parse(request.body);
      const created =
        payload.source === "clone"
          ? await options.store.cloneModule({
              sourceModuleId: payload.cloneFromModuleId ?? "",
              creatorToken,
              title: payload.title,
              slug: payload.slug,
            })
          : await options.store.createModule({
              creatorToken,
              title: payload.title,
              slug: payload.slug,
              seedPrompt: payload.seedPrompt,
              sessionScope: payload.sessionScope,
              launchProfile: payload.launchProfile,
            });
      return reply
        .code(201)
        .send(adventureModuleCreateResponseSchema.parse(created));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.get("/api/adventure-modules/by-slug/:slug", async (request, reply) => {
    const creatorToken = parseCreatorToken(request);
    try {
      const params = adventureModuleBySlugParamsSchema.parse(request.params ?? {});
      const moduleDetail = await options.store.getModuleBySlug(
        params.slug,
        creatorToken,
      );
      if (!moduleDetail) {
        return sendError(reply, 404, "Adventure module not found.");
      }
      return reply.send(adventureModuleGetResponseSchema.parse(moduleDetail));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.get("/api/adventure-modules/:moduleId", async (request, reply) => {
    const creatorToken = parseCreatorToken(request);
    const { moduleId = "" } = request.params as { moduleId?: string };
    const moduleDetail = await options.store.getModule(moduleId, creatorToken);
    if (!moduleDetail) {
      return sendError(reply, 404, "Adventure module not found.");
    }
    return reply.send(adventureModuleGetResponseSchema.parse(moduleDetail));
  });

  app.put("/api/adventure-modules/:moduleId/index", async (request, reply) => {
    const creatorToken = parseCreatorToken(request);
    const { moduleId = "" } = request.params as { moduleId?: string };
    try {
      const payload = adventureModuleUpdateIndexRequestSchema.parse(request.body);
      const next = await options.store.updateIndex({
        moduleId,
        index: payload.index,
        creatorToken,
      });
      return reply.send(adventureModuleUpdateResponseSchema.parse(next));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.put(
    "/api/adventure-modules/:moduleId/fragments/:fragmentId",
    async (request, reply) => {
      const creatorToken = parseCreatorToken(request);
      const { moduleId = "", fragmentId = "" } = request.params as {
        moduleId?: string;
        fragmentId?: string;
      };
      try {
        const payload = adventureModuleUpdateFragmentRequestSchema.parse(request.body);
        const next = await options.store.updateFragment({
          moduleId,
          fragmentId,
          content: payload.content,
          creatorToken,
        });
        return reply.send(adventureModuleUpdateResponseSchema.parse(next));
      } catch (error) {
        return sendKnownError(reply, error);
      }
    },
  );

  app.post("/api/adventure-modules/:moduleId/actors", async (request, reply) => {
    const creatorToken = parseCreatorToken(request);
    const { moduleId = "" } = request.params as { moduleId?: string };
    try {
      const payload = adventureModuleCreateActorRequestSchema.parse(request.body);
      const next = await options.store.createActor({
        moduleId,
        creatorToken,
        title: payload.title,
      });
      return reply.code(201).send(adventureModuleCreateResponseSchema.parse(next));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.put(
    "/api/adventure-modules/:moduleId/actors/:actorSlug",
    async (request, reply) => {
      const creatorToken = parseCreatorToken(request);
      const { moduleId = "", actorSlug = "" } = request.params as {
        moduleId?: string;
        actorSlug?: string;
      };
      try {
        const params = actorSlugParamsSchema.parse({ actorSlug });
        const payload = adventureModuleUpdateActorRequestSchema.parse(request.body);
        const next = await options.store.updateActor({
          moduleId,
          actorSlug: params.actorSlug,
          creatorToken,
          title: payload.title,
          summary: payload.summary,
          baseLayerSlug: payload.baseLayerSlug,
          tacticalRoleSlug: payload.tacticalRoleSlug,
          tacticalSpecialSlug:
            payload.tacticalSpecialSlug === null
              ? undefined
              : payload.tacticalSpecialSlug,
          content: payload.content,
        });
        return reply.send(adventureModuleUpdateActorResponseSchema.parse(next));
      } catch (error) {
        return sendKnownError(reply, error);
      }
    },
  );

  app.put("/api/adventure-modules/:moduleId/cover-image", async (request, reply) => {
    const creatorToken = parseCreatorToken(request);
    const { moduleId = "" } = request.params as { moduleId?: string };
    try {
      const payload = adventureModuleUpdateCoverImageRequestSchema.parse(request.body);
      const next = await options.store.updateCoverImage({
        moduleId,
        coverImageUrl: payload.coverImageUrl,
        creatorToken,
      });
      return reply.send(adventureModuleUpdateResponseSchema.parse(next));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.post("/api/adventure-modules/:moduleId/clone", async (request, reply) => {
    const creatorToken = parseCreatorToken(request);
    const { moduleId = "" } = request.params as { moduleId?: string };
    try {
      const payload = adventureModuleCloneRequestSchema.parse(request.body);
      const cloned = await options.store.cloneModule({
        sourceModuleId: moduleId,
        creatorToken,
        title: payload.title,
        slug: payload.slug,
      });
      return reply
        .code(201)
        .send(adventureModuleCreateResponseSchema.parse(cloned));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.get("/api/adventure-modules/:moduleId/preview", async (request, reply) => {
    const creatorToken = parseCreatorToken(request);
    const { moduleId = "" } = request.params as { moduleId?: string };
    try {
      const query = adventureModulePreviewQuerySchema.parse(request.query ?? {});
      const preview = await options.store.buildPreview({
        moduleId,
        creatorToken,
        showSpoilers: query.showSpoilers,
      });
      return reply.send(adventureModulePreviewResponseSchema.parse(preview));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });
};
