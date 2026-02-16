import Fastify from "fastify";
import cors from "@fastify/cors";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { Server as SocketServer } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@mighty-decks/spec/events";
import { OpenRouterClient } from "./ai/OpenRouterClient";
import { StorytellerService } from "./ai/StorytellerService";
import { AdventureManager } from "./adventure/AdventureManager";
import { env } from "./config/env";
import { AdventureDiagnosticsLogger } from "./diagnostics/AdventureDiagnosticsLogger";
import { CharacterPortraitCache } from "./image/CharacterPortraitCache";
import { CharacterPortraitService } from "./image/CharacterPortraitService";
import { CachedSceneImageService } from "./image/CachedSceneImageService";
import { FalClient } from "./image/FalClient";
import { ImageGenerationService } from "./image/ImageGenerationService";
import { ImageStore } from "./image/ImageStore";
import { LeonardoClient } from "./image/LeonardoClient";
import { registerImageRoutes } from "./image/registerImageRoutes";
import { registerSocketHandlers } from "./socket/registerSocketHandlers";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: env.corsOrigins,
  credentials: true,
});

const openRouterClient = new OpenRouterClient({
  apiKey: env.openRouterApiKey,
});
const falClient = new FalClient({
  apiKey: env.falApiKey,
  apiBaseUrl: env.imageGeneration.falApiBaseUrl,
  queueBaseUrl: env.imageGeneration.falQueueBaseUrl,
  pollIntervalMs: env.imageGeneration.falPollIntervalMs,
  pollTimeoutMs: env.imageGeneration.falPollTimeoutMs,
});
const leonardoClient = new LeonardoClient({
  apiKey: env.leonardoApiKey,
  baseUrl: env.imageGeneration.leonardoBaseUrl,
  pollIntervalMs: env.imageGeneration.pollIntervalMs,
  pollTimeoutMs: env.imageGeneration.pollTimeoutMs,
});
const imageStore = new ImageStore({
  rootDir: env.imageGeneration.outputDir,
  fileRouteBasePath: "/api/image/files",
});
await imageStore.initialize();
const characterPortraitCache = new CharacterPortraitCache({
  rootDir: env.imageGeneration.outputDir,
  imageStore,
});
await characterPortraitCache.initialize();
const imageGenerationService = new ImageGenerationService({
  falClient,
  leonardoClient,
  imageStore,
  maxActiveJobs: env.imageGeneration.maxActiveJobs,
  rateLimitPerMinute: env.imageGeneration.rateLimitPerMinute,
  downloadTimeoutMs: env.imageGeneration.pollTimeoutMs,
});
const cachedSceneImageService = new CachedSceneImageService({
  imageGenerationService,
});
const characterPortraitService = new CharacterPortraitService({
  falClient,
  leonardoClient,
  imageStore,
  cache: characterPortraitCache,
  openRouterClient,
  disableImageGeneration: env.costControls.disableImageGeneration,
});

let manager: AdventureManager;
const diagnosticsLogger = new AdventureDiagnosticsLogger({
  enabled: env.debugMode,
  logDir: env.debugLogDir,
});

const storyteller = new StorytellerService({
  openRouterClient,
  models: {
    narrativeDirector: env.models.narrativeDirector,
    narrativeDirectorFallback: "google/gemini-2.5-flash",
    sceneController: env.models.sceneController,
    sceneControllerFallback: "google/gemini-2.5-flash",
    outcomeDecider: env.models.outcomeDecider,
    outcomeDeciderFallback: "google/gemini-2.5-flash-lite",
    continuityKeeper: env.models.continuityKeeper,
    continuityKeeperFallback: "deepseek/deepseek-v3.2",
    pitchGenerator: env.models.pitchGenerator,
    pitchGeneratorFallback: "google/gemini-2.5-flash",
    imageGenerator: env.models.imageGenerator,
    imageGeneratorFallback: env.models.imageGeneratorFallback,
  },
  costControls: env.costControls,
  sceneImageGenerator: cachedSceneImageService,
  onAiRequest: (entry) => {
    manager?.appendAiRequestLog(entry);
  },
});

manager = new AdventureManager({
  debugMode: env.debugMode,
  maxActiveAdventures: env.maxActiveAdventures,
  runtimeConfigDefaults: env.runtimeConfigDefaults,
  storyteller,
  diagnosticsLogger,
  characterPortraitService,
});

const io = new SocketServer<ClientToServerEvents, ServerToClientEvents>(app.server, {
  cors: {
    origin: env.corsOrigins,
    methods: ["GET", "POST"],
  },
});

registerSocketHandlers(io, manager, {
  clientIdleTimeoutMs: env.clientIdleTimeoutMs,
});
registerImageRoutes(app, imageGenerationService);

app.get("/health", async () => {
  return {
    ok: true,
    service: "mighty-decks-server",
    timestamp: new Date().toISOString(),
  };
});

app.get("/adventures", async () => {
  const activeAdventures = manager.listActiveAdventures();
  return {
    count: activeAdventures.length,
    adventures: activeAdventures.map((adventure) => ({
      adventureId: adventure.adventureId,
      phase: adventure.phase,
      connectedPlayers: adventure.roster.filter(
        (entry) => entry.role === "player" && entry.connected,
      ).length,
      connectedScreens: adventure.roster.filter(
        (entry) => entry.role === "screen" && entry.connected,
      ).length,
    })),
  };
});

const WEB_DIST_DIR = resolve(process.cwd(), "../web/dist");
const HTML_CONTENT_TYPE = "text/html; charset=utf-8";
const CONTENT_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": HTML_CONTENT_TYPE,
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

const resolveWebFilePath = (requestPath: string): { absolutePath: string; isAssetRequest: boolean } | null => {
  const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
  const absolutePath = resolve(WEB_DIST_DIR, `.${normalizedPath}`);
  const withinDist = absolutePath === WEB_DIST_DIR || absolutePath.startsWith(`${WEB_DIST_DIR}${sep}`);
  if (!withinDist) {
    return null;
  }

  return {
    absolutePath,
    isAssetRequest: extname(requestPath).length > 0,
  };
};

if (existsSync(WEB_DIST_DIR)) {
  app.log.info(`Serving web client from ${WEB_DIST_DIR}`);

  app.get("/*", async (request, reply) => {
    const rawPath = request.raw.url?.split("?")[0] ?? "/";
    if (rawPath.startsWith("/socket.io")) {
      return reply.code(404).send({
        message: "Route not found",
      });
    }

    let decodedPath: string;
    try {
      decodedPath = decodeURIComponent(rawPath);
    } catch {
      return reply.code(400).send({
        message: "Invalid request path",
      });
    }

    const resolved = resolveWebFilePath(decodedPath);
    if (!resolved) {
      return reply.code(400).send({
        message: "Invalid request path",
      });
    }

    try {
      const body = await readFile(resolved.absolutePath);
      const extension = extname(resolved.absolutePath);
      reply.type(CONTENT_TYPES[extension] ?? "application/octet-stream");
      return reply.send(body);
    } catch {
      if (resolved.isAssetRequest) {
        return reply.code(404).send({
          message: "Route not found",
        });
      }

      try {
        const indexHtml = await readFile(resolve(WEB_DIST_DIR, "index.html"));
        reply.type(HTML_CONTENT_TYPE);
        return reply.send(indexHtml);
      } catch {
        return reply.code(500).send({
          message: "Web client is unavailable",
        });
      }
    }
  });
} else {
  app.log.warn(`Web dist not found at ${WEB_DIST_DIR}. Build apps/web to serve UI from this server.`);
}

const start = async (): Promise<void> => {
  try {
    await app.listen({
      port: env.port,
      host: "0.0.0.0",
    });

    app.log.info(`Server listening on ${env.port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

await start();
