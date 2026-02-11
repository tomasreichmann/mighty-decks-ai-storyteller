import { config as loadDotEnv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const envCandidates = [
  resolve(process.cwd(), ".env.local"),
  resolve(process.cwd(), "../../.env.local"),
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../../.env"),
];

for (const candidate of envCandidates) {
  if (existsSync(candidate)) {
    loadDotEnv({ path: candidate, override: false });
  }
}

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  CORS_ORIGINS: z.string().min(1).default("http://localhost:5173"),
  OPENROUTER_API_KEY: z.string().optional(),
  OR_TEXT_NARRATIVE_MODEL: z.string().min(1).default("deepseek/deepseek-v3.2"),
  OR_TEXT_SCENE_MODEL: z.string().min(1).default("google/gemini-2.5-flash-lite"),
  OR_TEXT_CONTINUITY_MODEL: z.string().min(1).default("google/gemini-2.5-flash-lite"),
  OR_TEXT_PITCH_MODEL: z.string().min(1).default("deepseek/deepseek-v3.2"),
  OR_IMAGE_MODEL: z.string().min(1).default("black-forest-labs/flux.2-klein-4b"),
  OR_IMAGE_MODEL_FALLBACK: z.string().min(1).optional(),
  DEBUG_MODE: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  MAX_ACTIVE_ADVENTURES: z.coerce.number().int().min(1).default(1),
  TEXT_CALL_TIMEOUT_MS: z.coerce.number().int().min(1000).default(20000),
  TURN_DEADLINE_MS: z.coerce.number().int().min(2000).default(18000),
  IMAGE_TIMEOUT_MS: z.coerce.number().int().min(1000).default(180000),
  AI_RETRY_COUNT: z.coerce.number().int().min(0).max(3).default(1),
  VOTE_TIMEOUT_MS: z.coerce.number().int().min(5000).default(20000),
  DEBUG_LOG_DIR: z.string().min(1).default("logs/adventures"),
});

const parsed = envSchema.parse(process.env);

const normalizeOrigin = (origin: string): string => origin.trim().replace(/\/+$/, "");

export const env = {
  port: parsed.PORT,
  corsOrigins: parsed.CORS_ORIGINS
    .split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean),
  openRouterApiKey: parsed.OPENROUTER_API_KEY && parsed.OPENROUTER_API_KEY.trim().length > 0
    ? parsed.OPENROUTER_API_KEY.trim()
    : null,
  models: {
    narrativeDirector: parsed.OR_TEXT_NARRATIVE_MODEL,
    sceneController: parsed.OR_TEXT_SCENE_MODEL,
    continuityKeeper: parsed.OR_TEXT_CONTINUITY_MODEL,
    pitchGenerator: parsed.OR_TEXT_PITCH_MODEL,
    imageGenerator: parsed.OR_IMAGE_MODEL,
    imageGeneratorFallback: parsed.OR_IMAGE_MODEL_FALLBACK,
  },
  debugMode: parsed.DEBUG_MODE ?? false,
  maxActiveAdventures: parsed.MAX_ACTIVE_ADVENTURES,
  debugLogDir: parsed.DEBUG_LOG_DIR,
  runtimeConfigDefaults: {
    textCallTimeoutMs: parsed.TEXT_CALL_TIMEOUT_MS,
    turnDeadlineMs: parsed.TURN_DEADLINE_MS,
    imageTimeoutMs: parsed.IMAGE_TIMEOUT_MS,
    aiRetryCount: parsed.AI_RETRY_COUNT,
    voteTimeoutMs: parsed.VOTE_TIMEOUT_MS,
  },
} as const;
