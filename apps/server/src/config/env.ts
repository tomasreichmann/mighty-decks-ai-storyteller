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
  PORT: z.coerce.number().int().min(1).max(65535).default(8081),
  CORS_ORIGINS: z.string().min(1).default("http://localhost:5173"),
  OPENROUTER_API_KEY: z.string().optional(),
  FAL_API_KEY: z.string().optional(),
  LEONARDO_API_KEY: z.string().optional(),
  FAL_API_BASE_URL: z.string().min(1).default("https://api.fal.ai/v1"),
  FAL_QUEUE_BASE_URL: z.string().min(1).default("https://queue.fal.run"),
  LEONARDO_BASE_URL: z
    .string()
    .min(1)
    .default("https://cloud.leonardo.ai/api/rest/v1"),
  OR_TEXT_NARRATIVE_MODEL: z.string().min(1).default("deepseek/deepseek-v3.2"),
  OR_TEXT_SCENE_MODEL: z
    .string()
    .min(1)
    .default("google/gemini-2.5-flash-lite"),
  OR_TEXT_OUTCOME_MODEL: z
    .string()
    .min(1)
    .default("google/gemini-2.5-flash-lite"),
  OR_TEXT_CONTINUITY_MODEL: z
    .string()
    .min(1)
    .default("google/gemini-2.5-flash-lite"),
  OR_TEXT_PITCH_MODEL: z.string().min(1).default("deepseek/deepseek-v3.2"),
  OR_IMAGE_MODEL: z
    .string()
    .min(1)
    .default("black-forest-labs/flux.2-klein-4b"),
  OR_IMAGE_MODEL_FALLBACK: z.string().min(1).optional(),
  WF_OR_FAST_TEXT_MODEL: z.string().min(1).default("google/gemini-2.5-flash-lite"),
  WF_OR_HQ_TEXT_MODEL: z.string().min(1).default("anthropic/claude-sonnet-4.6"),
  WF_OR_FAST_TOOL_MODEL: z.string().min(1).default("google/gemini-2.5-flash"),
  WF_OR_HQ_TOOL_MODEL: z.string().min(1).default("anthropic/claude-sonnet-4.6"),
  WF_OR_FAST_VISION_MODEL: z.string().min(1).default("google/gemini-2.5-flash"),
  WF_OR_HQ_VISION_MODEL: z.string().min(1).default("google/gemini-2.5-pro"),
  WF_FAL_FAST_IMAGE_MODEL: z.string().min(1).default("fal-ai/flux/schnell"),
  WF_FAL_HQ_IMAGE_MODEL: z
    .string()
    .min(1)
    .default("fal-ai/flux-pro/kontext/text-to-image"),
  WF_FAL_FAST_TTS_MODEL: z.string().min(1).default("fal-ai/minimax/speech-02-turbo"),
  WF_FAL_HQ_TTS_MODEL: z.string().min(1).default("fal-ai/minimax/speech-02-hd"),
  WF_FAL_FAST_STT_MODEL: z.string().min(1).default("fal-ai/wizper"),
  WF_FAL_HQ_STT_MODEL: z.string().min(1).default("fal-ai/speech-to-text"),
  DISABLE_IMAGE_GENERATION: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  PITCH_CACHE_TTL_MS: z.coerce.number().int().min(0).default(0),
  IMAGE_CACHE_TTL_MS: z.coerce.number().int().min(0).default(0),
  DEBUG_MODE: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  MAX_ACTIVE_ADVENTURES: z.coerce.number().int().min(1).default(1),
  CLIENT_IDLE_TIMEOUT_MS: z.coerce.number().int().min(60_000).default(900_000),
  TEXT_CALL_TIMEOUT_MS: z.coerce.number().int().min(1000).default(30000),
  TURN_DEADLINE_MS: z.coerce.number().int().min(2000).default(18000),
  IMAGE_TIMEOUT_MS: z.coerce.number().int().min(1000).default(180000),
  AI_RETRY_COUNT: z.coerce.number().int().min(0).max(3).default(1),
  VOTE_TIMEOUT_MS: z.coerce.number().int().min(5000).default(60000),
  WORKFLOW_RUN_TIMEOUT_MS: z.coerce.number().int().min(1000).default(180000),
  WORKFLOW_DEFAULT_RETRY_COUNT: z.coerce.number().int().min(0).max(5).default(1),
  WORKFLOW_TEXT_STEP_TIMEOUT_MS: z.coerce.number().int().min(1000).default(30000),
  WORKFLOW_TOOL_STEP_TIMEOUT_MS: z.coerce.number().int().min(1000).default(45000),
  WORKFLOW_VISION_STEP_TIMEOUT_MS: z.coerce.number().int().min(1000).default(45000),
  WORKFLOW_IMAGE_STEP_TIMEOUT_MS: z.coerce.number().int().min(1000).default(120000),
  WORKFLOW_TTS_STEP_TIMEOUT_MS: z.coerce.number().int().min(1000).default(60000),
  WORKFLOW_STT_STEP_TIMEOUT_MS: z.coerce.number().int().min(1000).default(60000),
  WORKFLOW_LAB_LOG_DIR: z.string().min(1).default("output/workflow-lab-runs"),
  DEBUG_LOG_DIR: z.string().min(1).default("logs/adventures"),
  ADVENTURE_SNAPSHOT_DIR: z
    .string()
    .min(1)
    .default("output/adventure-snapshots"),
  ADVENTURE_SNAPSHOT_HISTORY_LIMIT: z.coerce.number().int().min(1).default(20),
  ADVENTURE_SNAPSHOT_WRITE_DEBOUNCE_MS: z.coerce.number().int().min(0).default(400),
  ADVENTURE_ARTIFACT_DIR: z
    .string()
    .min(1)
    .default("output/adventure-artifacts"),
  ADVENTURE_MODULE_DIR: z
    .string()
    .min(1)
    .default("output/adventure-modules"),
  IMAGE_OUTPUT_DIR: z.string().min(1).default("output/generated-images"),
  IMAGE_MAX_ACTIVE_JOBS: z.coerce.number().int().min(1).default(4),
  IMAGE_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).default(10),
  FAL_POLL_INTERVAL_MS: z.coerce.number().int().min(100).default(1000),
  FAL_POLL_TIMEOUT_MS: z.coerce.number().int().min(1000).optional(),
  LEONARDO_POLL_INTERVAL_MS: z.coerce.number().int().min(100).default(1000),
  LEONARDO_POLL_TIMEOUT_MS: z.coerce.number().int().min(1000).optional(),
});

const parsed = envSchema.parse(process.env);

const normalizeOrigin = (origin: string): string =>
  origin.trim().replace(/\/+$/, "");

const LOOPBACK_HOST_ALIASES = ["localhost", "127.0.0.1", "[::1]"] as const;

const isLoopbackHost = (hostname: string): boolean => {
  const normalizedHost = hostname.toLowerCase();
  return (
    normalizedHost === "localhost" ||
    normalizedHost === "127.0.0.1" ||
    normalizedHost === "::1" ||
    normalizedHost === "[::1]"
  );
};

const expandLoopbackOriginAliases = (origins: string[]): string[] => {
  const expandedOrigins = new Set<string>();

  for (const origin of origins) {
    expandedOrigins.add(origin);

    try {
      const parsedOrigin = new URL(origin);
      if (!isLoopbackHost(parsedOrigin.hostname)) {
        continue;
      }

      const portSegment = parsedOrigin.port ? `:${parsedOrigin.port}` : "";
      for (const aliasHost of LOOPBACK_HOST_ALIASES) {
        expandedOrigins.add(
          normalizeOrigin(`${parsedOrigin.protocol}//${aliasHost}${portSegment}`),
        );
      }
    } catch {
      // Keep invalid entries as-is so Zod validation remains the source of truth.
    }
  }

  return [...expandedOrigins];
};

const parseCorsOrigins = (rawValue: string): string[] =>
  expandLoopbackOriginAliases(
    rawValue
      .split(",")
      .map((origin) => normalizeOrigin(origin))
      .filter(Boolean),
  );

export const env = {
  port: parsed.PORT,
  corsOrigins: parseCorsOrigins(parsed.CORS_ORIGINS),
  openRouterApiKey:
    parsed.OPENROUTER_API_KEY && parsed.OPENROUTER_API_KEY.trim().length > 0
      ? parsed.OPENROUTER_API_KEY.trim()
      : null,
  falApiKey:
    parsed.FAL_API_KEY && parsed.FAL_API_KEY.trim().length > 0
      ? parsed.FAL_API_KEY.trim()
      : null,
  leonardoApiKey:
    parsed.LEONARDO_API_KEY && parsed.LEONARDO_API_KEY.trim().length > 0
      ? parsed.LEONARDO_API_KEY.trim()
      : null,
  models: {
    narrativeDirector: parsed.OR_TEXT_NARRATIVE_MODEL,
    sceneController: parsed.OR_TEXT_SCENE_MODEL,
    outcomeDecider: parsed.OR_TEXT_OUTCOME_MODEL,
    continuityKeeper: parsed.OR_TEXT_CONTINUITY_MODEL,
    pitchGenerator: parsed.OR_TEXT_PITCH_MODEL,
    imageGenerator: parsed.OR_IMAGE_MODEL,
    imageGeneratorFallback: parsed.OR_IMAGE_MODEL_FALLBACK,
  },
  debugMode: parsed.DEBUG_MODE ?? false,
  maxActiveAdventures: parsed.MAX_ACTIVE_ADVENTURES,
  clientIdleTimeoutMs: parsed.CLIENT_IDLE_TIMEOUT_MS,
  debugLogDir: parsed.DEBUG_LOG_DIR,
  adventureSnapshots: {
    outputDir: parsed.ADVENTURE_SNAPSHOT_DIR,
    historyLimit: parsed.ADVENTURE_SNAPSHOT_HISTORY_LIMIT,
    writeDebounceMs: parsed.ADVENTURE_SNAPSHOT_WRITE_DEBOUNCE_MS,
  },
  adventureArtifacts: {
    outputDir: parsed.ADVENTURE_ARTIFACT_DIR,
  },
  adventureModules: {
    outputDir: parsed.ADVENTURE_MODULE_DIR,
  },
  costControls: {
    disableImageGeneration: parsed.DISABLE_IMAGE_GENERATION ?? false,
    pitchCacheTtlMs: parsed.PITCH_CACHE_TTL_MS,
    imageCacheTtlMs: parsed.IMAGE_CACHE_TTL_MS,
  },
  runtimeConfigDefaults: {
    textCallTimeoutMs: parsed.TEXT_CALL_TIMEOUT_MS,
    turnDeadlineMs: parsed.TURN_DEADLINE_MS,
    imageTimeoutMs: parsed.IMAGE_TIMEOUT_MS,
    aiRetryCount: parsed.AI_RETRY_COUNT,
    voteTimeoutMs: parsed.VOTE_TIMEOUT_MS,
  },
  imageGeneration: {
    outputDir: parsed.IMAGE_OUTPUT_DIR,
    maxActiveJobs: parsed.IMAGE_MAX_ACTIVE_JOBS,
    rateLimitPerMinute: parsed.IMAGE_RATE_LIMIT_PER_MINUTE,
    falApiBaseUrl: parsed.FAL_API_BASE_URL,
    falQueueBaseUrl: parsed.FAL_QUEUE_BASE_URL,
    falPollIntervalMs: parsed.FAL_POLL_INTERVAL_MS,
    falPollTimeoutMs: parsed.FAL_POLL_TIMEOUT_MS ?? parsed.IMAGE_TIMEOUT_MS,
    leonardoBaseUrl: parsed.LEONARDO_BASE_URL,
    pollIntervalMs: parsed.LEONARDO_POLL_INTERVAL_MS,
    pollTimeoutMs: parsed.LEONARDO_POLL_TIMEOUT_MS ?? parsed.IMAGE_TIMEOUT_MS,
  },
  workflow: {
    labLogDir: parsed.WORKFLOW_LAB_LOG_DIR,
    modelRegistry: {
      fast_text_model: parsed.WF_OR_FAST_TEXT_MODEL,
      hq_text_model: parsed.WF_OR_HQ_TEXT_MODEL,
      fast_tool_model: parsed.WF_OR_FAST_TOOL_MODEL,
      hq_tool_model: parsed.WF_OR_HQ_TOOL_MODEL,
      fast_image_model: parsed.WF_FAL_FAST_IMAGE_MODEL,
      hq_image_model: parsed.WF_FAL_HQ_IMAGE_MODEL,
      fast_vision_model: parsed.WF_OR_FAST_VISION_MODEL,
      hq_vision_model: parsed.WF_OR_HQ_VISION_MODEL,
      fast_tts_model: parsed.WF_FAL_FAST_TTS_MODEL,
      hq_tts_model: parsed.WF_FAL_HQ_TTS_MODEL,
      fast_stt_model: parsed.WF_FAL_FAST_STT_MODEL,
      hq_stt_model: parsed.WF_FAL_HQ_STT_MODEL,
    },
    executionDefaults: {
      runTimeoutMs: parsed.WORKFLOW_RUN_TIMEOUT_MS,
      defaultRetryCount: parsed.WORKFLOW_DEFAULT_RETRY_COUNT,
      stepTimeoutMs: {
        llm_text: {
          text: parsed.WORKFLOW_TEXT_STEP_TIMEOUT_MS,
          tool: parsed.WORKFLOW_TOOL_STEP_TIMEOUT_MS,
          vision: parsed.WORKFLOW_VISION_STEP_TIMEOUT_MS,
        },
        llm_image: parsed.WORKFLOW_IMAGE_STEP_TIMEOUT_MS,
        tts: parsed.WORKFLOW_TTS_STEP_TIMEOUT_MS,
        stt: parsed.WORKFLOW_STT_STEP_TIMEOUT_MS,
        code: 10_000,
        map: parsed.WORKFLOW_RUN_TIMEOUT_MS,
      },
    },
  },
} as const;
