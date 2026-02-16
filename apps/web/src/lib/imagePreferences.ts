import type { ImageProvider } from "@mighty-decks/spec/imageGeneration";

const FAVORITE_MODELS_KEY = "mighty_decks_image_favorite_models";
const LAST_USED_MODEL_KEY = "mighty_decks_image_last_model";

const withProviderScope = (key: string, provider: ImageProvider): string =>
  `${key}_${provider}`;

const readStringArray = (key: string): string[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((candidate): candidate is string => typeof candidate === "string")
      .map((candidate) => candidate.trim())
      .filter((candidate) => candidate.length > 0);
  } catch {
    return [];
  }
};

const writeStringArray = (key: string, values: string[]): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(values));
};

export const loadFavoriteModels = (provider: ImageProvider): string[] => {
  const values = readStringArray(withProviderScope(FAVORITE_MODELS_KEY, provider));
  return [...new Set(values)];
};

export const toggleFavoriteModel = (
  provider: ImageProvider,
  modelId: string,
): string[] => {
  const trimmed = modelId.trim();
  if (trimmed.length === 0) {
    return loadFavoriteModels(provider);
  }

  const favorites = loadFavoriteModels(provider);
  const hasFavorite = favorites.includes(trimmed);
  const nextFavorites = hasFavorite
    ? favorites.filter((candidate) => candidate !== trimmed)
    : [trimmed, ...favorites];
  writeStringArray(withProviderScope(FAVORITE_MODELS_KEY, provider), nextFavorites);
  return nextFavorites;
};

export const loadLastUsedModel = (provider: ImageProvider): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(
    withProviderScope(LAST_USED_MODEL_KEY, provider),
  );
  const trimmed = raw?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
};

export const saveLastUsedModel = (
  provider: ImageProvider,
  modelId: string,
): void => {
  if (typeof window === "undefined") {
    return;
  }

  const trimmed = modelId.trim();
  if (trimmed.length === 0) {
    return;
  }

  window.localStorage.setItem(
    withProviderScope(LAST_USED_MODEL_KEY, provider),
    trimmed,
  );
};
