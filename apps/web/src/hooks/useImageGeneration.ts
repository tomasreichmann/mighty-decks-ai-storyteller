import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  GeneratedImageGroup,
  ImageJob,
  ImageModelSummary,
  ImageProvider,
} from "@mighty-decks/spec/imageGeneration";
import {
  createImageJob,
  deleteBatchFromGroup,
  deleteImageFromGroup,
  fetchImageGroup,
  fetchImageJob,
  fetchImageModels,
  lookupImageGroup,
  setActiveImage,
} from "../lib/imageApi";
import {
  loadFavoriteModels,
  loadLastUsedModel,
  saveLastUsedModel,
  toggleFavoriteModel,
} from "../lib/imagePreferences";

export interface ImageResolutionPreset {
  id: string;
  label: string;
  width: number;
  height: number;
}

export const IMAGE_RESOLUTION_PRESETS: ImageResolutionPreset[] = [
  { id: "1024x1024", label: "1024 x 1024", width: 1024, height: 1024 },
  { id: "1280x720", label: "1280 x 720", width: 1280, height: 720 },
  { id: "1536x1024", label: "1536 x 1024", width: 1536, height: 1024 },
  { id: "720x1280", label: "720 x 1280", width: 720, height: 1280 },
  { id: "1024x1536", label: "1024 x 1536", width: 1024, height: 1536 },
];

const clampAmount = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.min(8, Math.max(1, Math.round(value)));
};

const parsePositiveInt = (raw: string, fallback: number): number => {
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const sortModelsWithFavorites = (
  models: ImageModelSummary[],
  favoriteModelIds: string[],
): ImageModelSummary[] => {
  const favoriteSet = new Set(favoriteModelIds);
  return [...models].sort((left, right) => {
    const leftFavorite = favoriteSet.has(left.modelId);
    const rightFavorite = favoriteSet.has(right.modelId);
    if (leftFavorite !== rightFavorite) {
      return leftFavorite ? -1 : 1;
    }

    return left.displayName.localeCompare(right.displayName);
  });
};

interface UseImageGenerationResult {
  provider: ImageProvider;
  models: ImageModelSummary[];
  sortedModels: ImageModelSummary[];
  favoriteModelIds: string[];
  selectedModelId: string;
  prompt: string;
  amount: number;
  useCache: boolean;
  resolutionPresetId: string;
  customWidth: string;
  customHeight: string;
  group: GeneratedImageGroup | null;
  job: ImageJob | null;
  loadingModels: boolean;
  submittingJob: boolean;
  refreshingGroup: boolean;
  error: string | null;
  resolvedResolution: { width: number; height: number };
  setProvider: (provider: ImageProvider) => void;
  setSelectedModelId: (modelId: string) => void;
  setPrompt: (prompt: string) => void;
  setAmount: (amount: number) => void;
  setUseCache: (useCache: boolean) => void;
  setResolutionPresetId: (presetId: string) => void;
  setCustomWidth: (value: string) => void;
  setCustomHeight: (value: string) => void;
  toggleFavorite: (modelId: string) => void;
  lookupCurrentGroup: () => Promise<void>;
  submitJob: () => Promise<void>;
  selectActiveImage: (imageId: string) => Promise<void>;
  deleteImage: (imageId: string) => Promise<void>;
  deleteBatch: (batchIndex: number) => Promise<void>;
  clearError: () => void;
}

export const useImageGeneration = (): UseImageGenerationResult => {
  const [provider, setProviderState] = useState<ImageProvider>("fal");
  const [models, setModels] = useState<ImageModelSummary[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [submittingJob, setSubmittingJob] = useState(false);
  const [refreshingGroup, setRefreshingGroup] = useState(false);
  const [favoriteModelIds, setFavoriteModelIds] = useState<string[]>(
    loadFavoriteModels("fal"),
  );
  const [selectedModelId, setSelectedModelIdState] = useState("");
  const [prompt, setPrompt] = useState("");
  const [amount, setAmountState] = useState(1);
  const [useCache, setUseCache] = useState(true);
  const [resolutionPresetId, setResolutionPresetId] = useState(
    IMAGE_RESOLUTION_PRESETS[0]!.id,
  );
  const [customWidth, setCustomWidth] = useState("1024");
  const [customHeight, setCustomHeight] = useState("1024");
  const [group, setGroup] = useState<GeneratedImageGroup | null>(null);
  const [job, setJob] = useState<ImageJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedModels = useMemo(
    () => sortModelsWithFavorites(models, favoriteModelIds),
    [favoriteModelIds, models],
  );

  useEffect(() => {
    setFavoriteModelIds(loadFavoriteModels(provider));
  }, [provider]);

  useEffect(() => {
    let cancelled = false;

    const loadModels = async (): Promise<void> => {
      setLoadingModels(true);
      try {
        const nextModels = await fetchImageModels(provider);
        if (cancelled) {
          return;
        }

        setModels(nextModels);
        const lastUsedModel = loadLastUsedModel(provider);
        setSelectedModelIdState((current) => {
          if (
            current.length > 0 &&
            nextModels.some((candidate) => candidate.modelId === current)
          ) {
            return current;
          }

          if (
            lastUsedModel &&
            nextModels.some((candidate) => candidate.modelId === lastUsedModel)
          ) {
            return lastUsedModel;
          }

          return nextModels[0]?.modelId ?? "";
        });
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load image models.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingModels(false);
        }
      }
    };

    void loadModels();

    return () => {
      cancelled = true;
    };
  }, [provider]);

  const resolvedResolution = useMemo(() => {
    const selectedPreset = IMAGE_RESOLUTION_PRESETS.find(
      (candidate) => candidate.id === resolutionPresetId,
    );
    if (selectedPreset) {
      return {
        width: selectedPreset.width,
        height: selectedPreset.height,
      };
    }

    return {
      width: Math.max(64, Math.min(4096, parsePositiveInt(customWidth, 1024))),
      height: Math.max(
        64,
        Math.min(4096, parsePositiveInt(customHeight, 1024)),
      ),
    };
  }, [customHeight, customWidth, resolutionPresetId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setProvider = useCallback((nextProvider: ImageProvider) => {
    setProviderState(nextProvider);
    setGroup(null);
    setJob(null);
    setSelectedModelIdState("");
  }, []);

  const setSelectedModelId = useCallback((modelId: string) => {
    const trimmed = modelId.trim();
    setSelectedModelIdState(trimmed);
    if (trimmed.length > 0) {
      saveLastUsedModel(provider, trimmed);
    }
  }, [provider]);

  const setAmount = useCallback((nextAmount: number) => {
    setAmountState(clampAmount(nextAmount));
  }, []);

  const toggleFavorite = useCallback((modelId: string) => {
    const next = toggleFavoriteModel(provider, modelId);
    setFavoriteModelIds(next);
  }, [provider]);

  const lookupCurrentGroup = useCallback(async (): Promise<void> => {
    if (prompt.trim().length === 0 || selectedModelId.trim().length === 0) {
      setGroup(null);
      return;
    }

    setRefreshingGroup(true);
    setError(null);
    try {
      const matchedGroup = await lookupImageGroup({
        provider,
        prompt,
        model: selectedModelId,
      });
      setGroup(matchedGroup);
    } catch (lookupError) {
      setError(
        lookupError instanceof Error
          ? lookupError.message
          : "Could not lookup image group.",
      );
    } finally {
      setRefreshingGroup(false);
    }
  }, [prompt, provider, selectedModelId]);

  const submitJob = useCallback(async (): Promise<void> => {
    const normalizedPrompt = prompt.trim();
    if (normalizedPrompt.length === 0) {
      setError("Prompt is required.");
      return;
    }
    if (selectedModelId.trim().length === 0) {
      setError("Select an image model first.");
      return;
    }

    setSubmittingJob(true);
    setError(null);
    try {
      const createdJob = await createImageJob({
        provider,
        prompt: normalizedPrompt,
        model: selectedModelId,
        resolution: resolvedResolution,
        useCache,
        amount,
      });
      setJob(createdJob);
      saveLastUsedModel(provider, selectedModelId);

      if (createdJob.status !== "running") {
        const loadedGroup = await fetchImageGroup(createdJob.groupKey);
        setGroup(loadedGroup);
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not create image generation job.",
      );
    } finally {
      setSubmittingJob(false);
    }
  }, [amount, prompt, provider, resolvedResolution, selectedModelId, useCache]);

  useEffect(() => {
    if (!job || job.status !== "running") {
      return;
    }

    let cancelled = false;
    const targetJobId = job.jobId;
    let interval: number | null = null;

    const pollOnce = async (): Promise<void> => {
      try {
        const nextJob = await fetchImageJob(targetJobId);
        if (cancelled) {
          return;
        }

        setJob(nextJob);
        if (nextJob.status !== "running") {
          const loadedGroup = await fetchImageGroup(nextJob.groupKey);
          if (!cancelled) {
            setGroup(loadedGroup);
          }
          if (interval !== null) {
            window.clearInterval(interval);
            interval = null;
          }
        }
      } catch (pollError) {
        if (!cancelled) {
          setError(
            pollError instanceof Error
              ? pollError.message
              : "Could not fetch image generation status.",
          );
        }
      }
    };

    interval = window.setInterval(() => {
      void pollOnce();
    }, 1000);

    return () => {
      cancelled = true;
      if (interval !== null) {
        window.clearInterval(interval);
      }
    };
  }, [job?.jobId, job?.status]);

  const updateGroup = useCallback((nextGroup: GeneratedImageGroup) => {
    setGroup(nextGroup);
  }, []);

  const selectActiveImage = useCallback(
    async (imageId: string): Promise<void> => {
      if (!group) {
        return;
      }

      setError(null);
      try {
        const updatedGroup = await setActiveImage(group.groupKey, imageId);
        updateGroup(updatedGroup);
      } catch (selectionError) {
        setError(
          selectionError instanceof Error
            ? selectionError.message
            : "Could not set active image.",
        );
      }
    },
    [group, updateGroup],
  );

  const deleteImage = useCallback(
    async (imageId: string): Promise<void> => {
      if (!group) {
        return;
      }

      setError(null);
      try {
        const updatedGroup = await deleteImageFromGroup(group.groupKey, imageId);
        updateGroup(updatedGroup);
      } catch (deleteError) {
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Could not delete image.",
        );
      }
    },
    [group, updateGroup],
  );

  const deleteBatch = useCallback(
    async (batchIndex: number): Promise<void> => {
      if (!group) {
        return;
      }

      setError(null);
      try {
        const updatedGroup = await deleteBatchFromGroup(
          group.groupKey,
          batchIndex,
        );
        updateGroup(updatedGroup);
      } catch (deleteError) {
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Could not delete batch.",
        );
      }
    },
    [group, updateGroup],
  );

  return {
    provider,
    models,
    sortedModels,
    favoriteModelIds,
    selectedModelId,
    prompt,
    amount,
    useCache,
    resolutionPresetId,
    customWidth,
    customHeight,
    group,
    job,
    loadingModels,
    submittingJob,
    refreshingGroup,
    error,
    resolvedResolution,
    setProvider,
    setSelectedModelId,
    setPrompt,
    setAmount,
    setUseCache,
    setResolutionPresetId,
    setCustomWidth,
    setCustomHeight,
    toggleFavorite,
    lookupCurrentGroup,
    submitJob,
    selectActiveImage,
    deleteImage,
    deleteBatch,
    clearError,
  };
};
