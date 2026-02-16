import type {
  ImageModelSummary,
  ImageProvider,
} from "@mighty-decks/spec/imageGeneration";

export const CHARACTER_PORTRAIT_PLACEHOLDER_URL =
  "/profiles/profile-placeholder.png";

export const CHARACTER_PORTRAIT_RESOLUTION = {
  width: 512,
  height: 512,
} as const;

export const CHARACTER_PORTRAIT_PROVIDER: ImageProvider = "fal";

export const CHARACTER_PORTRAIT_PROMPT_MODEL = "google/gemini-2.5-flash-lite";

export const CHARACTER_PORTRAIT_BASE_PROMPT =
  "painterly digital painting of a character's bust in profile facing right. Set against solid color background.";

export const CHARACTER_PORTRAIT_PROMPT_TIMEOUT_MS = 15_000;
export const CHARACTER_PORTRAIT_IMAGE_TIMEOUT_MS = 60_000;

const STREAM_VARIANT_REGEX = /(^|\/)stream($|\/)/i;

interface PortraitProviderConfig {
  modelCandidates: string[];
  fallbackModel: string;
}

const PROVIDER_CONFIG: Record<ImageProvider, PortraitProviderConfig> = {
  fal: {
    modelCandidates: ["fal-ai/flux-2/klein/9b", "fal-ai/flux/schnell"],
    fallbackModel: "fal-ai/flux/schnell",
  },
  leonardo: {
    modelCandidates: [
      "aa77f04e-3eec-4034-9c07-d0f619684628",
      "1e60896f-3c26-4296-8ecc-53e2afecc132",
    ],
    fallbackModel: "aa77f04e-3eec-4034-9c07-d0f619684628",
  },
};

const normalizeModelId = (value: string): string => value.trim().toLowerCase();

export const isStreamVariantModelId = (modelId: string): boolean =>
  STREAM_VARIANT_REGEX.test(modelId.trim());

export const resolvePortraitModelId = (
  provider: ImageProvider,
  models: ImageModelSummary[],
): string => {
  const providerConfig = PROVIDER_CONFIG[provider];
  const modelsByNormalizedId = new Map(
    models.map((model) => [normalizeModelId(model.modelId), model.modelId]),
  );

  for (const candidate of providerConfig.modelCandidates) {
    const resolved = modelsByNormalizedId.get(normalizeModelId(candidate));
    if (resolved) {
      return resolved;
    }
  }

  const nonStreamModel = models.find(
    (model) => !isStreamVariantModelId(model.modelId),
  );
  if (nonStreamModel) {
    return nonStreamModel.modelId;
  }

  return models[0]?.modelId ?? providerConfig.fallbackModel;
};
