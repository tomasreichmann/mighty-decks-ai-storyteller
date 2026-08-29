import type { FastifyInstance } from "fastify";
import { readinessResponseSchema } from "@mighty-decks/spec/readiness";

export const registerReadinessRoutes = (app: FastifyInstance): void => {
  app.get("/api/readiness", async () =>
    readinessResponseSchema.parse({
      ok: true,
      status: "ready",
      service: "mighty-decks-ai-storyteller",
      timestamp: new Date().toISOString(),
    }),
  );
};
