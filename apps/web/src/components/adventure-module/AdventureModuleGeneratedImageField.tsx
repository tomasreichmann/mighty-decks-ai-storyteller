import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  GeneratedImageAsset,
  GeneratedImageGroup,
  ImageModelSummary,
} from "@mighty-decks/spec/imageGeneration";
import { useImageGeneration } from "../../hooks/useImageGeneration";
import { uploadAdventureArtifactImage } from "../../lib/adventureArtifactApi";
import { toMarkdownPlainTextSnippet } from "../../lib/markdownSnippet";
import { cn } from "../../utils/cn";
import { Button } from "../common/Button";
import { DepressedInput } from "../common/DepressedInput";
import { InputDescriptionHint } from "../common/InputDescriptionHint";
import { Label } from "../common/Label";
import { Message } from "../common/Message";
import { SmartInput } from "../common/SmartInput";
import { Tags } from "../common/Tags";
import { Text } from "../common/Text";
import { GeneratedImage, type ImageGeneration } from "../GeneratedImage";

const PROMPT_MAX_LENGTH = 4000;
const WORKFLOW_CONTEXT_MAX_LENGTH = 1000;
const SELECT_CLASSES =
  "w-full border-2 border-kac-iron rounded-sm bg-gradient-to-b from-[#f8efd8] to-[#e5d4b9] px-3 py-2 text-kac-iron font-ui";

const PREFERRED_FAST_MODEL_IDS = [
  "fal-ai/flux/schnell",
  "fal-ai/flux-1/schnell",
  "fal-ai/flux-2/flash",
  "fal-ai/fast-sdxl",
] as const;

const normalizeWhitespace = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

export const truncateImagePromptText = (
  value: string,
  maxLength: number,
): string => {
  if (value.length <= maxLength) {
    return value;
  }
  if (maxLength <= 3) {
    return value.slice(0, maxLength);
  }
  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
};

export const toImagePromptSnippet = (
  value: string,
  maxLength: number,
): string => toMarkdownPlainTextSnippet(value, maxLength).trim();

export const toImagePromptTagListSnippet = (
  values: string[],
  maxLength: number,
): string => {
  const normalizedValues = values
    .map((value) => normalizeWhitespace(value))
    .filter((value) => value.length > 0);
  if (normalizedValues.length === 0) {
    return "";
  }

  return truncateImagePromptText(normalizedValues.join(", "), maxLength);
};

const normalizePromptForMatch = (value: string): string =>
  value.trim().replace(/\s+/g, " ");

const normalizeImageUrl = (value: string | null | undefined): string =>
  value?.trim() ?? "";

/**
 * Extract the stored file name from an `/api/image/files/:fileName` URL.
 * Falls back to the raw path segment when the file name is not valid URI
 * encoding.
 */
const extractFileNameFromUrl = (url: string): string | null => {
  const prefix = "/api/image/files/";
  const trimmed = url.trim();
  const prefixIndex = trimmed.lastIndexOf(prefix);
  if (prefixIndex < 0) {
    return null;
  }
  const encoded = trimmed.slice(prefixIndex + prefix.length);
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
};

const isLikelyFastModel = (modelId: string): boolean => {
  const normalized = modelId.toLocaleLowerCase();
  return (
    normalized.includes("/schnell") ||
    normalized.includes("/flash") ||
    normalized.includes("/lightning") ||
    normalized.includes("/fast")
  );
};

const resolvePreferredFastModelId = (
  models: ImageModelSummary[],
): string | null => {
  for (const preferredModelId of PREFERRED_FAST_MODEL_IDS) {
    if (models.some((model) => model.modelId === preferredModelId)) {
      return preferredModelId;
    }
  }

  const byModelId = models.find((model) => isLikelyFastModel(model.modelId));
  if (byModelId) {
    return byModelId.modelId;
  }

  const byDisplayName = models.find((model) =>
    isLikelyFastModel(model.displayName),
  );
  return byDisplayName?.modelId ?? null;
};

const sortImages = (images: GeneratedImageAsset[]): GeneratedImageAsset[] =>
  [...images].sort((left, right) => {
    if (left.batchIndex !== right.batchIndex) {
      return left.batchIndex - right.batchIndex;
    }
    if (left.imageIndex !== right.imageIndex) {
      return left.imageIndex - right.imageIndex;
    }
    return left.createdAtIso.localeCompare(right.createdAtIso);
  });

const toDisplayImage = (
  image: GeneratedImageAsset,
  alt: string,
): ImageGeneration => ({
  imageId: image.imageId,
  imageUrl: image.fileUrl,
  alt,
});

export interface AdventureModuleGeneratedImageFieldProps {
  label: string;
  promptLabel: string;
  promptDescription: string;
  contextLabel: string;
  contextDescription: string;
  workflowContextIntro: string;
  value?: string;
  disabled?: boolean;
  contextTagOptions?: readonly string[];
  defaultContextTags?: readonly string[];
  emptyLabel?: string;
  pendingLabel?: string;
  generateLabel?: string;
  valueFieldLabel?: string;
  valueFieldDescription?: string;
  identityKey?: string;
  onChange: (nextValue: string) => void;
  onBlur?: () => void;
  resolveContextLines?: (selectedContextTags: string[]) => string[];
}

export const AdventureModuleGeneratedImageField = ({
  label,
  promptLabel,
  promptDescription,
  contextLabel,
  contextDescription,
  workflowContextIntro,
  value = "",
  disabled = false,
  contextTagOptions = [],
  defaultContextTags = [],
  emptyLabel = "No image selected.",
  pendingLabel = "Generating image...",
  generateLabel,
  valueFieldLabel,
  valueFieldDescription,
  identityKey,
  onChange,
  onBlur,
  resolveContextLines,
}: AdventureModuleGeneratedImageFieldProps): JSX.Element => {
  const [contextTags, setContextTags] = useState<string[]>([
    ...defaultContextTags,
  ]);
  const [preferredModelInitialized, setPreferredModelInitialized] =
    useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDropActive, setIsDropActive] = useState(false);
  const [crossModelGroups, setCrossModelGroups] = useState<
    GeneratedImageGroup[]
  >([]);
  const [loadingCrossModel, setLoadingCrossModel] = useState(false);
  const lastAutoSelectedImageUrlRef = useRef<string>("");
  const autoLookupDoneRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
  const {
    sortedModels,
    selectedModelId,
    prompt,
    group,
    job,
    loadingModels,
    submittingJob,
    refreshingGroup,
    error,
    setSelectedModelId,
    setPrompt,
    lookupCurrentGroup,
    lookupGroupByFileName,
    lookupGroupsByPrompt,
    listAllGroups,
    submitJob,
    selectActiveImage,
    clearError,
  } = useImageGeneration();

  const contextLines = useMemo(
    () => resolveContextLines?.(contextTags) ?? [],
    [contextTags, resolveContextLines],
  );
  const composedPrompt = useMemo(() => {
    const normalizedPrompt = prompt.trim();
    if (contextLines.length === 0) {
      return truncateImagePromptText(normalizedPrompt, PROMPT_MAX_LENGTH);
    }
    const contextBlock = contextLines.map((line) => `- ${line}`).join("\n");
    return truncateImagePromptText(
      `${normalizedPrompt}\n\nAdventure context:\n${contextBlock}`,
      PROMPT_MAX_LENGTH,
    );
  }, [contextLines, prompt]);
  const workflowContextDescription = useMemo(() => {
    const lines = [workflowContextIntro, promptDescription];
    if (contextLines.length > 0) {
      lines.push("Selected context:");
      for (const line of contextLines) {
        lines.push(`- ${line}`);
      }
    }
    return truncateImagePromptText(
      lines.join("\n"),
      WORKFLOW_CONTEXT_MAX_LENGTH,
    );
  }, [contextLines, promptDescription, workflowContextIntro]);

  useEffect(() => {
    setContextTags([...defaultContextTags]);
    setPrompt("");
    clearError();
    setUploadError(null);
    setUploadingImage(false);
    setIsDropActive(false);
    dragDepthRef.current = 0;
    setCrossModelGroups([]);
    autoLookupDoneRef.current = false;
    lastAutoSelectedImageUrlRef.current = normalizeImageUrl(value);
  }, [clearError, defaultContextTags, identityKey, setPrompt, value]);

  useEffect(() => {
    if (preferredModelInitialized || sortedModels.length === 0) {
      return;
    }

    const preferredFastModelId = resolvePreferredFastModelId(sortedModels);
    setPreferredModelInitialized(true);
    if (!preferredFastModelId) {
      return;
    }
    if (selectedModelId === preferredFastModelId) {
      return;
    }
    if (
      selectedModelId.trim().length > 0 &&
      isLikelyFastModel(selectedModelId)
    ) {
      return;
    }

    setSelectedModelId(preferredFastModelId);
  }, [
    preferredModelInitialized,
    selectedModelId,
    setSelectedModelId,
    sortedModels,
  ]);

  // Rehydrate the persisted selection after remount by resolving the stored
  // file URL back to its generation group.
  useEffect(() => {
    if (autoLookupDoneRef.current || disabled || group) {
      return;
    }

    const normalizedValue = normalizeImageUrl(value);
    if (normalizedValue.length === 0) {
      autoLookupDoneRef.current = true;
      return;
    }

    const fileName = extractFileNameFromUrl(normalizedValue);
    if (!fileName) {
      autoLookupDoneRef.current = true;
      return;
    }

    autoLookupDoneRef.current = true;
    void lookupGroupByFileName(fileName);
  }, [disabled, group, lookupGroupByFileName, value]);

  const matchingGroup = useMemo(() => {
    if (!group) {
      return null;
    }
    // Accept either the current prompt/model pair or the persisted image URL so
    // remounts can restore the matching batch without prompt state.
    const promptAndModelMatch =
      normalizePromptForMatch(group.prompt) ===
        normalizePromptForMatch(composedPrompt) &&
      group.model === selectedModelId;
    if (promptAndModelMatch) {
      return group;
    }
    const normalizedValue = normalizeImageUrl(value);
    if (
      normalizedValue.length > 0 &&
      group.images.some(
        (img) => normalizeImageUrl(img.fileUrl) === normalizedValue,
      )
    ) {
      return group;
    }
    return null;
  }, [composedPrompt, group, selectedModelId, value]);

  const sortedImages = useMemo(
    () => (matchingGroup ? sortImages(matchingGroup.images) : []),
    [matchingGroup],
  );
  const activeImage = useMemo(() => {
    if (sortedImages.length === 0) {
      return null;
    }
    if (matchingGroup?.activeImageId) {
      return (
        sortedImages.find(
          (candidate) => candidate.imageId === matchingGroup.activeImageId,
        ) ?? sortedImages[0]
      );
    }
    return sortedImages[0];
  }, [matchingGroup?.activeImageId, sortedImages]);
  const activeBatchImages = useMemo(() => {
    if (!activeImage) {
      return [];
    }
    return sortedImages.filter(
      (candidate) => candidate.batchIndex === activeImage.batchIndex,
    );
  }, [activeImage, sortedImages]);

  useEffect(() => {
    if (disabled || !activeImage) {
      return;
    }

    const normalizedValue = normalizeImageUrl(value);
    const nextUrl = normalizeImageUrl(activeImage.fileUrl);
    if (nextUrl.length === 0) {
      return;
    }
    if (
      normalizedValue.length > 0 &&
      normalizedValue !== lastAutoSelectedImageUrlRef.current
    ) {
      return;
    }
    if (normalizedValue === nextUrl) {
      lastAutoSelectedImageUrlRef.current = nextUrl;
      return;
    }

    lastAutoSelectedImageUrlRef.current = nextUrl;
    onChange(nextUrl);
  }, [activeImage, disabled, onChange, value]);

  const hasPrompt = prompt.trim().length > 0;
  const matchingJob =
    job &&
    normalizePromptForMatch(job.request.prompt) ===
      normalizePromptForMatch(composedPrompt) &&
    job.request.model === selectedModelId
      ? job
      : null;
  const pending = submittingJob || matchingJob?.status === "running";
  const failed = !pending && matchingJob?.status === "failed";
  const failedItem = matchingJob?.items.find(
    (item) => item.status === "failed",
  );
  const failedReason = failedItem?.error?.trim() ?? "";
  const atCapacityError = (error ?? "")
    .toLocaleLowerCase()
    .includes("at capacity");
  const showFailedState = Boolean(failed && !atCapacityError);
  const failedLabel =
    failedReason.length > 0
      ? `${label} generation failed: ${failedReason}`
      : `${label} generation failed. Try adjusting context or regenerating.`;
  const canRunActions =
    !disabled &&
    !loadingModels &&
    selectedModelId.trim().length > 0 &&
    hasPrompt &&
    !pending;
  const canLookup =
    !disabled &&
    !loadingModels &&
    !pending;

  // With a prompt, keep the current-model match primary and show other model
  // matches separately. Without a prompt, fall back to browsing every stored
  // group for the provider.
  const handleLookupWithCrossModel = useCallback(async () => {
    const normalizedValue = normalizeImageUrl(value);
    const userTypedPrompt = prompt.trim().length > 0;

    if (userTypedPrompt) {
      void lookupCurrentGroup(composedPrompt);
      setLoadingCrossModel(true);
      try {
        const allGroups = await lookupGroupsByPrompt(composedPrompt);
        setCrossModelGroups(
          allGroups.filter((g) => g.model !== selectedModelId),
        );
      } finally {
        setLoadingCrossModel(false);
      }
    } else {
      // Without a prompt match, show every stored group in the fallback gallery.
      if (normalizedValue.length > 0) {
        const fileName = extractFileNameFromUrl(normalizedValue);
        if (fileName) {
          void lookupGroupByFileName(fileName);
        }
      }
      setLoadingCrossModel(true);
      try {
        const allGroups = await listAllGroups();
        setCrossModelGroups(allGroups);
      } finally {
        setLoadingCrossModel(false);
      }
    }
  }, [composedPrompt, group, listAllGroups, lookupCurrentGroup, lookupGroupByFileName, lookupGroupsByPrompt, prompt, selectedModelId, value]);

  const crossModelImages = useMemo(() => {
    const images: (GeneratedImageAsset & { _groupModel: string })[] = [];
    for (const g of crossModelGroups) {
      for (const img of g.images) {
        images.push({ ...img, _groupModel: g.model });
      }
    }
    return images;
  }, [crossModelGroups]);
  const displayImage = useMemo<ImageGeneration | null>(() => {
    const normalizedValue = normalizeImageUrl(value);
    if (normalizedValue.length > 0) {
      if (
        activeImage &&
        normalizeImageUrl(activeImage.fileUrl) === normalizedValue
      ) {
        return toDisplayImage(activeImage, `${label} preview`);
      }
      return {
        imageId: normalizedValue,
        imageUrl: normalizedValue,
        alt: `${label} preview`,
      };
    }
    return activeImage ? toDisplayImage(activeImage, `${label} preview`) : null;
  }, [activeImage, label, value]);

  const openFilePicker = (): void => {
    if (disabled || uploadingImage) {
      return;
    }

    setUploadError(null);
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (file: File): Promise<void> => {
    if (disabled || uploadingImage) {
      return;
    }

    setUploadingImage(true);
    setUploadError(null);
    try {
      const artifact = await uploadAdventureArtifactImage(file, {
        hint: file.name,
      });
      lastAutoSelectedImageUrlRef.current = normalizeImageUrl(
        artifact.fileUrl,
      );
      onChange(artifact.fileUrl);
      onBlur?.();
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Could not upload the image. Try another file.",
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileSelection = async (
    files: FileList | File[] | null,
  ): Promise<void> => {
    const file = files?.[0];
    if (!file) {
      return;
    }

    await handleFileUpload(file);
  };

  const clearDropDepth = (): void => {
    dragDepthRef.current = 0;
    setIsDropActive(false);
  };

  return (
    <div className="stack gap-3">
      <div className="flex items-end gap-2">
        <DepressedInput
          label={valueFieldLabel ?? "Selected Image URL"}
          description={
            valueFieldDescription ??
            "Paste an existing image URL, drop an image, or pick one from the generated batch below."
          }
          value={value}
          onChange={(event) => {
            setUploadError(null);
            onChange(event.target.value);
          }}
          onBlur={onBlur}
          disabled={disabled}
          maxLength={500}
          placeholder="https://..."
          className="min-w-0 flex-1"
        />

        <Button
          variant="circle"
          color="blood"
          size="sm"
          onClick={() => {
            setUploadError(null);
            onChange("");
            onBlur?.();
          }}
          disabled={disabled || normalizeImageUrl(value).length === 0}
          aria-label="Clear image"
          title="Clear image"
          className="shrink-0"
        >
          <span aria-hidden="true">🗑</span>
        </Button>
      </div>

      <div
        className={cn(
          "group flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed px-4 py-4 text-center transition",
          disabled || uploadingImage
            ? "cursor-not-allowed border-kac-iron/30 bg-kac-bone-light/50 opacity-70"
            : isDropActive
              ? "border-kac-gold-dark bg-kac-gold-light/35"
              : "border-kac-iron/45 bg-kac-bone-light/65 hover:border-kac-gold-dark/70 hover:bg-kac-bone-light",
        )}
        role="button"
        tabIndex={disabled || uploadingImage ? -1 : 0}
        aria-disabled={disabled || uploadingImage}
        onClick={openFilePicker}
        onDragEnter={(event) => {
          if (disabled || uploadingImage) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          dragDepthRef.current += 1;
          setIsDropActive(true);
        }}
        onDragOver={(event) => {
          if (disabled || uploadingImage) {
            return;
          }
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={(event) => {
          if (disabled || uploadingImage) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
          if (dragDepthRef.current === 0) {
            setIsDropActive(false);
          }
        }}
        onDrop={(event) => {
          if (disabled || uploadingImage) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          clearDropDepth();
          void handleFileSelection(event.dataTransfer.files);
        }}
        onKeyDown={(event) => {
          if (disabled || uploadingImage) {
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openFilePicker();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            void handleFileSelection(event.currentTarget.files);
            event.currentTarget.value = "";
          }}
        />

        <Text variant="note" color="iron" className="text-sm !opacity-100">
          {uploadingImage
            ? "Uploading image..."
            : "Drop an external image here or click to browse."}
        </Text>
        <Text variant="note" color="iron-light" className="text-xs !opacity-100">
          Dropped images are saved on the server and can be reused in this field.
        </Text>
      </div>

      {uploadError ? (
        <Text variant="note" color="blood" className="text-sm !opacity-100">
          {uploadError}
        </Text>
      ) : null}

      <div className="relative z-40 flex min-h-6 flex-col items-stretch gap-2 md:flex-row md:items-start md:justify-between">
        <div className="-mb-2 -ml-1 relative self-start z-20 inline-flex items-center gap-2">
          <Label color="gold">{promptLabel}</Label>
          <InputDescriptionHint description={contextDescription} className="-translate-y-1 z-50" />
        </div>
        {contextTagOptions.length > 0 ? (
          <Tags
            label={contextLabel}
            value={contextTags}
            onChange={setContextTags}
            options={[...contextTagOptions]}
            allowCustom={false}
            addButtonLabel="Add Context"
            maxTags={contextTagOptions.length}
            placeholder="Search context..."
            disabled={disabled || pending}
            chrome="borderless"
            showLabel={false}
            showEmptyState={false}
            showCounter={false}
            className="md:ml-auto"
          />
        ) : null}
      </div>

      <SmartInput
        label={promptLabel}
        description={promptDescription}
        workflowContextDescription={workflowContextDescription}
        showLabel={false}
        value={prompt}
        onChange={setPrompt}
        disabled={disabled || pending}
        maxLength={PROMPT_MAX_LENGTH}
        placeholder="Describe the key scene, subject, mood, and composition."
      />

      <label className="stack gap-1">
        <Text variant="note" color="iron" className="text-base">
          Image Model
        </Text>
        <select
          className={SELECT_CLASSES}
          value={selectedModelId}
          onChange={(event) => setSelectedModelId(event.target.value)}
          disabled={disabled || loadingModels || pending}
        >
          {sortedModels.map((model) => (
            <option key={model.modelId} value={model.modelId}>
              {model.displayName} - {model.modelId}
            </option>
          ))}
        </select>
      </label>

      {selectedModelId.trim().length > 0 &&
      !isLikelyFastModel(selectedModelId) ? (
        <Text
          variant="note"
          color="iron-light"
          className="text-sm !opacity-100"
        >
          This model may run slower. For faster turnaround, use a
          `schnell/flash` model.
        </Text>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="ghost"
          color="cloth"
          onClick={() => {
            void handleLookupWithCrossModel();
          }}
          disabled={!canLookup || refreshingGroup || loadingCrossModel}
        >
          {refreshingGroup || loadingCrossModel
            ? "Loading..."
            : "Lookup Existing"}
        </Button>
        <Button
          color="gold"
          onClick={() => {
            void submitJob(composedPrompt);
          }}
          disabled={!canRunActions}
        >
          {pending ? "Generating..." : generateLabel ?? `Generate ${label}`}
        </Button>
      </div>

      {contextLines.length === 0 ? (
        <Text
          variant="note"
          color="iron-light"
          className="text-sm !opacity-100"
        >
          No context tags selected. Generation will use only your prompt text.
        </Text>
      ) : null}

      {group && !matchingGroup ? (
        <Text
          variant="note"
          color="iron-light"
          className="text-sm !opacity-100"
        >
          Prompt or model changed. Use Lookup Existing or generate a fresh
          batch.
        </Text>
      ) : null}

      {matchingJob ? (
        <Text
          variant="note"
          color="iron-light"
          className="text-sm !opacity-100"
        >
          Status: {matchingJob.status} | completed {matchingJob.succeededCount}/
          {matchingJob.totalRequested} (cached {matchingJob.cachedCount},
          generated {matchingJob.generatedCount}, failed{" "}
          {matchingJob.failedCount})
        </Text>
      ) : null}

      {error ? (
        <Message label={label} color="blood" onLabelClick={clearError}>
          {error}
        </Message>
      ) : null}
      {showFailedState && failedReason.length > 0 ? (
        <Text variant="note" color="blood" className="text-sm !opacity-100">
          Last failure: {failedReason}
        </Text>
      ) : null}
      {atCapacityError ? (
        <Text
          variant="note"
          color="iron-light"
          className="text-sm !opacity-100"
        >
          Image workers are currently busy. Retry once active jobs complete.
        </Text>
      ) : null}

      <GeneratedImage
        image={displayImage}
        batch={activeBatchImages.map((image) =>
          toDisplayImage(image, `${label} batch option`),
        )}
        onChange={(nextImage) => {
          void selectActiveImage(nextImage.imageId);
          lastAutoSelectedImageUrlRef.current = normalizeImageUrl(
            nextImage.imageUrl,
          );
          onChange(nextImage.imageUrl);
        }}
        pending={pending}
        failed={showFailedState}
        pendingLabel={pendingLabel}
        failedLabel={failedLabel}
        emptyLabel={emptyLabel}
        implicitFailure={false}
      />

      {crossModelImages.length > 0 ? (
        <div className="stack gap-2">
          <Text variant="note" color="iron" className="text-sm !opacity-100">
            Previously generated images (click to select):
          </Text>
          <div className="flex flex-wrap gap-2">
            {crossModelImages.map((image) => (
              <button
                key={image.imageId}
                type="button"
                className="relative cursor-pointer overflow-hidden rounded border-2 border-kac-iron hover:border-kac-gold-dark transition-colors"
                style={{ width: 96, height: 96 }}
                title={`${image._groupModel} — click to select`}
                onClick={() => {
                  lastAutoSelectedImageUrlRef.current = normalizeImageUrl(
                    image.fileUrl,
                  );
                  onChange(image.fileUrl);
                }}
              >
                <img
                  src={image.fileUrl}
                  alt={`${label} from ${image._groupModel}`}
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 text-[10px] text-white truncate">
                  {image._groupModel.split("/").pop()}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
