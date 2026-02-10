import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server as SocketServer } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@mighty-decks/spec/events";
import { OpenRouterClient } from "./ai/OpenRouterClient";
import { StorytellerService } from "./ai/StorytellerService";
import { AdventureManager } from "./adventure/AdventureManager";
import { env } from "./config/env";
import { AdventureDiagnosticsLogger } from "./diagnostics/AdventureDiagnosticsLogger";
import { registerSocketHandlers } from "./socket/registerSocketHandlers";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: env.corsOrigins,
  credentials: true,
});

const openRouterClient = new OpenRouterClient({
  apiKey: env.openRouterApiKey,
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
    continuityKeeper: env.models.continuityKeeper,
    continuityKeeperFallback: "deepseek/deepseek-v3.2",
    pitchGenerator: env.models.pitchGenerator,
    pitchGeneratorFallback: "google/gemini-2.5-flash",
    imageGenerator: env.models.imageGenerator,
    imageGeneratorFallback: env.models.imageGeneratorFallback,
  },
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
});

const io = new SocketServer<ClientToServerEvents, ServerToClientEvents>(app.server, {
  cors: {
    origin: env.corsOrigins,
    methods: ["GET", "POST"],
  },
});

registerSocketHandlers(io, manager);

app.get("/health", async () => {
  return {
    ok: true,
    service: "mighty-decks-server",
    timestamp: new Date().toISOString(),
  };
});

app.get("/adventures", async () => {
  return {
    count: manager.listAdventures().length,
    adventures: manager.listAdventures().map((adventure) => ({
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
