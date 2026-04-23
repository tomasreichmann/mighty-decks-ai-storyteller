import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  GeneratedImageAsset,
  GeneratedImageGroup,
  ImageEditJob,
  ImageJob,
  ImageModelSummary,
} from "@mighty-decks/spec/imageGeneration";
import { useImageGeneration } from "../../hooks/useImageGeneration";
import { uploadAdventureArtifactImage } from "../../lib/adventureArtifactApi";
import { toMarkdownPlainTextSnippet } from "../../lib/markdownSnippet";
import { cn } from "../../utils/cn";
import { GeneratedImage } from "../GeneratedImage";
import { Button } from "../common/Button";
import {
  ButtonRadioGroup,
  type ButtonRadioGroupOption,
} from "../common/ButtonRadioGroup";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import { InputDescriptionHint } from "../common/InputDescriptionHint";
import { Label } from "../common/Label";
import { Message } from "../common/Message";
import { SmartInput } from "../common/SmartInput";
import { Tags } from "../common/Tags";
import { Text } from "../common/Text";
import { TextField } from "../common/TextField";
import { PendingIndicator } from "../PendingIndicator";
import { useConfirmationDialog } from "../../hooks/useConfirmationDialog";

const PROMPT_MAX_LENGTH = 4000;
const WORKFLOW_CONTEXT_MAX_LENGTH = 1000;
const SELECT_CLASSES =
  "w-full max-w-md border-2 border-kac-iron rounded-sm bg-gradient-to-b from-[#f8efd8] to-[#e5d4b9] px-3 py-2 text-sm text-kac-iron font-ui shadow-[inset_2px_2px_0_0_#9f8a6d,inset_-2px_-2px_0_0_#fff7e6]";

const PREFERRED_FAST_MODEL_IDS = [
  "fal-ai/flux/schnell",
  "fal-ai/flux-1/schnell",
  "fal-ai/flux-2/flash",
  "fal-ai/fast-sdxl",
] as const;

type ImageDialogMode = "gallery" | "generate" | "edit";

interface GalleryImageItem {
  image: GeneratedImageAsset;
  group: GeneratedImageGroup;
}

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

const toGalleryItems = (groups: GeneratedImageGroup[]): GalleryImageItem[] =>
  groups
    .flatMap((group) =>
      group.images.map((image) => ({
        group,
        image,
      })),
    )
    .sort((left, right) => {
      if (left.image.createdAtIso !== right.image.createdAtIso) {
        return right.image.createdAtIso.localeCompare(left.image.createdAtIso);
      }
      if (left.image.batchIndex !== right.image.batchIndex) {
        return right.image.batchIndex - left.image.batchIndex;
      }
      if (left.image.imageIndex !== right.image.imageIndex) {
        return right.image.imageIndex - left.image.imageIndex;
      }
      return right.image.imageId.localeCompare(left.image.imageId);
    });

const resolveJobImage = (
  group: GeneratedImageGroup | null,
  job: ImageJob | ImageEditJob | null,
): GeneratedImageAsset | null => {
  if (!group || !job || group.groupKey !== job.groupKey) {
    return null;
  }

  const targetImageId = [...job.items]
    .reverse()
    .find((item) => item.imageId)?.imageId;
  if (!targetImageId) {
    return null;
  }

  return (
    group.images.find((candidate) => candidate.imageId === targetImageId) ??
    null
  );
};

const buildTooltipDescription = (item: GalleryImageItem): string =>
  `Prompt: ${item.group.prompt} | Model: ${item.group.model}`;

const modeOptions: ButtonRadioGroupOption<ImageDialogMode>[] = [
  { label: "Gallery", value: "gallery" },
  { label: "Generate", value: "generate" },
  { label: "Edit", value: "edit" },
];

const renderModelOptions = (models: ImageModelSummary[]): JSX.Element[] =>
  models.map((model) => (
    <option key={model.modelId} value={model.modelId}>
      {model.displayName}
    </option>
  ));

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
  valueFieldLabel,
  valueFieldDescription,
  identityKey,
  onChange,
  onBlur,
  resolveContextLines,
}: AdventureModuleGeneratedImageFieldProps): JSX.Element => {
  const [mode, setMode] = useState<ImageDialogMode>("gallery");
  const [contextTags, setContextTags] = useState<string[]>([
    ...defaultContextTags,
  ]);
  const [editPrompt, setEditPrompt] = useState("");
  const [preferredModelInitialized, setPreferredModelInitialized] =
    useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDropActive, setIsDropActive] = useState(false);
  const [galleryGroups, setGalleryGroups] = useState<GeneratedImageGroup[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [removingImageId, setRemovingImageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
  const handledGenerateJobIdRef = useRef<string>("");
  const handledEditJobIdRef = useRef<string>("");
  const { confirmation, requestConfirmation } = useConfirmationDialog();
  const {
    sortedModels,
    editModels,
    selectedModelId,
    selectedEditModelId,
    prompt,
    group,
    job,
    editJob,
    loadingModels,
    loadingEditModels,
    submittingJob,
    submittingEditJob,
    error,
    setSelectedModelId,
    setSelectedEditModelId,
    setPrompt,
    listAllGroups,
    submitJob,
    submitEditJob,
    deleteImage,
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

  const refreshGallery = useCallback(async (): Promise<void> => {
    setLoadingGallery(true);
    try {
      const nextGroups = await listAllGroups();
      setGalleryGroups(nextGroups);
    } finally {
      setLoadingGallery(false);
    }
  }, [listAllGroups]);

  useEffect(() => {
    setMode("gallery");
    setContextTags([...defaultContextTags]);
    setPrompt("");
    setEditPrompt("");
    clearError();
    setUploadError(null);
    setUploadingImage(false);
    setIsDropActive(false);
    setLoadingGallery(false);
    setRemovingImageId(null);
    setPreferredModelInitialized(false);
    dragDepthRef.current = 0;
    handledGenerateJobIdRef.current = "";
    handledEditJobIdRef.current = "";
    void refreshGallery();
  }, [clearError, defaultContextTags, identityKey, refreshGallery, setPrompt]);

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

  const galleryItems = useMemo(
    () => toGalleryItems(galleryGroups),
    [galleryGroups],
  );

  const selectedGeneratedItem = useMemo(() => {
    const normalizedValue = normalizeImageUrl(value);
    if (normalizedValue.length === 0) {
      return null;
    }

    return (
      galleryItems.find(
        (item) => normalizeImageUrl(item.image.fileUrl) === normalizedValue,
      ) ?? null
    );
  }, [galleryItems, value]);

  const previewImage = useMemo(() => {
    const normalizedValue = normalizeImageUrl(value);
    if (normalizedValue.length === 0) {
      return null;
    }

    return {
      imageId: selectedGeneratedItem?.image.imageId ?? normalizedValue,
      imageUrl: normalizedValue,
      alt: `${label} preview`,
    };
  }, [label, selectedGeneratedItem?.image.imageId, value]);

  const matchingGenerateJob = useMemo(() => {
    if (!job) {
      return null;
    }

    return normalizePromptForMatch(job.request.prompt) ===
      normalizePromptForMatch(composedPrompt) &&
      job.request.model === selectedModelId
      ? job
      : null;
  }, [composedPrompt, job, selectedModelId]);

  const matchingEditJob = useMemo(() => {
    if (!editJob) {
      return null;
    }

    return normalizePromptForMatch(editJob.request.prompt) ===
      normalizePromptForMatch(editPrompt) &&
      editJob.request.model === selectedEditModelId &&
      normalizeImageUrl(editJob.request.sourceImageUrl) ===
        normalizeImageUrl(value)
      ? editJob
      : null;
  }, [editJob, editPrompt, selectedEditModelId, value]);

  useEffect(() => {
    if (
      !matchingGenerateJob ||
      matchingGenerateJob.status === "running" ||
      handledGenerateJobIdRef.current === matchingGenerateJob.jobId
    ) {
      return;
    }

    handledGenerateJobIdRef.current = matchingGenerateJob.jobId;
    const nextImage = resolveJobImage(group, matchingGenerateJob);
    if (nextImage) {
      onChange(nextImage.fileUrl);
    }
    void refreshGallery();
  }, [group, matchingGenerateJob, onChange, refreshGallery]);

  useEffect(() => {
    if (
      !matchingEditJob ||
      matchingEditJob.status === "running" ||
      handledEditJobIdRef.current === matchingEditJob.jobId
    ) {
      return;
    }

    handledEditJobIdRef.current = matchingEditJob.jobId;
    const nextImage = resolveJobImage(group, matchingEditJob);
    if (nextImage) {
      onChange(nextImage.fileUrl);
    }
    void refreshGallery();
  }, [group, matchingEditJob, onChange, refreshGallery]);

  const hasPrompt = prompt.trim().length > 0;
  const hasEditPrompt = editPrompt.trim().length > 0;
  const hasSelectedImage = normalizeImageUrl(value).length > 0;
  const generatePending =
    submittingJob || matchingGenerateJob?.status === "running";
  const editPending =
    submittingEditJob || matchingEditJob?.status === "running";
  const canGenerate =
    !disabled &&
    !loadingModels &&
    selectedModelId.trim().length > 0 &&
    hasPrompt &&
    !generatePending;
  const canGenerateEdit =
    !disabled &&
    !loadingEditModels &&
    hasSelectedImage &&
    selectedEditModelId.trim().length > 0 &&
    hasEditPrompt &&
    !editPending;

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
      onChange(artifact.fileUrl);
      onBlur?.();
    } catch (nextError) {
      setUploadError(
        nextError instanceof Error
          ? nextError.message
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

  const removeGalleryImage = useCallback(
    async (item: GalleryImageItem): Promise<void> => {
      const isSelected =
        normalizeImageUrl(item.image.fileUrl) === normalizeImageUrl(value);
      requestConfirmation({
        title: "Remove image from gallery?",
        description: isSelected
          ? "Remove this selected image from the gallery? The current selection will be cleared."
          : "Remove this image from the gallery?",
        confirmLabel: "Remove Image",
        confirmColor: "blood",
        onConfirm: async () => {
          setRemovingImageId(item.image.imageId);
          try {
            await deleteImage(item.image.imageId, item.group.groupKey);
            if (isSelected) {
              onChange("");
            }
            await refreshGallery();
          } finally {
            setRemovingImageId(null);
          }
        },
      });
    },
    [deleteImage, onChange, refreshGallery, requestConfirmation, value],
  );

  return (
    <div className="stack gap-3">
      <div className="flex items-end gap-2">
          <TextField
          label={valueFieldLabel ?? "Selected Image URL"}
          description={
            valueFieldDescription ??
            "Paste an existing image URL, drop an image, or pick one from the gallery below."
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
          <span aria-hidden="true">{"\u{1F5D1}"}</span>
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
          {uploadingImage ? (
            <PendingIndicator label="Uploading image" color="cloth" />
          ) : (
            "Drop an external image here or click to browse."
          )}
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

      {confirmation ? <ConfirmationDialog {...confirmation} /> : null}

      <GeneratedImage
        image={previewImage}
        pending={generatePending || editPending}
        pendingLabel={editPending ? "Generating image edit..." : pendingLabel}
        emptyLabel={emptyLabel}
        implicitFailure={false}
      />

      {selectedGeneratedItem ? (
        <div className="stack gap-1">
          <Text
            variant="note"
            color="iron-light"
            className="text-sm !opacity-100 overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
          >
            {selectedGeneratedItem.group.prompt}
          </Text>
          <Text variant="note" color="iron-light" className="text-xs !opacity-100">
            {selectedGeneratedItem.group.model}
          </Text>
        </div>
      ) : null}

      <ButtonRadioGroup
        ariaLabel={`${label} image mode`}
        color="gold"
        size="sm"
        value={mode}
        options={modeOptions}
        onValueChange={setMode}
      />

      {mode === "gallery" ? (
        loadingGallery ? (
          <Message label="Gallery" color="cloth" contentClassName="flex justify-center">
            <PendingIndicator label="Loading existing images" color="cloth" />
          </Message>
        ) : galleryItems.length === 0 ? (
          <Message label="Gallery" color="cloth">
            No generated images yet. Use Generate or Edit to add one.
          </Message>
        ) : (
          <div className="grid gap-3 overflow-visible sm:grid-cols-2 lg:grid-cols-3">
            {galleryItems.map((item) => {
              const isSelected =
                normalizeImageUrl(item.image.fileUrl) === normalizeImageUrl(value);

              return (
                <div
                  key={item.image.imageId}
                  className="relative overflow-visible"
                >
                  <div className="absolute left-2 top-0 z-20 -translate-y-1/2">
                    <InputDescriptionHint
                      description={buildTooltipDescription(item)}
                      placement="bottom"
                    />
                  </div>

                  <div className="absolute right-2 top-0 z-20 -translate-y-1/2">
                    <Button
                      variant="circle"
                      color="blood"
                      size="sm"
                      aria-label="Remove image"
                      title="Remove image"
                      disabled={
                        disabled || removingImageId === item.image.imageId
                      }
                      onClick={() => {
                        void removeGalleryImage(item);
                      }}
                    >
                      x
                    </Button>
                  </div>

                  <div
                    className={cn(
                      "rounded-sm border-2 bg-kac-bone-light p-2",
                      isSelected
                        ? "border-kac-gold-dark shadow-[0_0_0_2px_rgba(196,146,39,0.2)]"
                        : "border-kac-iron",
                    )}
                  >
                    <button
                      type="button"
                      className="block w-full overflow-hidden rounded-sm"
                      onClick={() => {
                        onChange(item.image.fileUrl);
                        onBlur?.();
                      }}
                    >
                      <img
                        src={item.image.fileUrl}
                        alt={`${label} gallery option`}
                        className="aspect-square w-full object-contain object-center"
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : null}

      {mode === "generate" ? (
        <div className="stack gap-3">
          <div className="relative z-40 flex min-h-6 flex-col items-stretch gap-2 md:flex-row md:items-start md:justify-between">
            <div className="-mb-2 -ml-1 relative self-start z-20 inline-flex items-center gap-2">
              <Label color="gold">{promptLabel}</Label>
              <InputDescriptionHint
                description={contextDescription}
                className="-translate-y-1 z-50"
              />
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
                disabled={disabled || generatePending}
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
            disabled={disabled || generatePending}
            maxLength={PROMPT_MAX_LENGTH}
            placeholder="Describe the key scene, subject, mood, and composition."
          />

          <div className="stack items-start gap-1">
            <Label color="bone" rotate={false}>
              Image Model
            </Label>
            <select
              className={SELECT_CLASSES}
              value={selectedModelId}
              onChange={(event) => setSelectedModelId(event.target.value)}
              disabled={disabled || loadingModels || generatePending}
            >
              {renderModelOptions(sortedModels)}
            </select>
          </div>

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

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              color="gold"
              onClick={() => {
                void submitJob(composedPrompt);
              }}
              disabled={!canGenerate}
            >
              {generatePending ? (
                <PendingIndicator label="Generating" color="gold" />
              ) : (
                "Generate"
              )}
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

          {matchingGenerateJob ? (
            <Text
              variant="note"
              color="iron-light"
              className="text-sm !opacity-100"
            >
              Status: {matchingGenerateJob.status} | completed{" "}
              {matchingGenerateJob.succeededCount}/
              {matchingGenerateJob.totalRequested} (cached{" "}
              {matchingGenerateJob.cachedCount}, generated{" "}
              {matchingGenerateJob.generatedCount}, failed{" "}
              {matchingGenerateJob.failedCount})
            </Text>
          ) : null}
        </div>
      ) : null}

      {mode === "edit" ? (
        <div className="stack gap-3">
          <div className="-mb-2 -ml-1 relative self-start z-20 inline-flex items-center gap-2">
            <Label color="gold">Edit Prompt</Label>
            <InputDescriptionHint
              description="Describe the edits you want to apply to the currently selected image."
              className="-translate-y-1 z-50"
            />
          </div>

          <SmartInput
            label="Edit Prompt"
            description="Describe how the selected image should change."
            workflowContextDescription="Use concrete changes like lighting, composition, costume, background, or style adjustments."
            showLabel={false}
            value={editPrompt}
            onChange={setEditPrompt}
            disabled={disabled || editPending}
            maxLength={PROMPT_MAX_LENGTH}
            placeholder="Describe the edits you want to make to the selected image."
          />

          <div className="stack items-start gap-1">
            <Label color="bone" rotate={false}>
              Edit Model
            </Label>
            <select
              className={SELECT_CLASSES}
              value={selectedEditModelId}
              onChange={(event) => setSelectedEditModelId(event.target.value)}
              disabled={disabled || loadingEditModels || editPending}
            >
              {renderModelOptions(editModels)}
            </select>
          </div>

          {!hasSelectedImage ? (
            <Text
              variant="note"
              color="iron-light"
              className="text-sm !opacity-100"
            >
              Select an image before generating an edit.
            </Text>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              color="gold"
              onClick={() => {
                void submitEditJob(value, editPrompt);
              }}
              disabled={!canGenerateEdit}
            >
              {editPending ? (
                <PendingIndicator label="Generating edit" color="gold" />
              ) : (
                "Generate Edit"
              )}
            </Button>
          </div>

          {matchingEditJob ? (
            <Text
              variant="note"
              color="iron-light"
              className="text-sm !opacity-100"
            >
              Status: {matchingEditJob.status} | completed{" "}
              {matchingEditJob.succeededCount}/{matchingEditJob.totalRequested}{" "}
              (cached {matchingEditJob.cachedCount}, generated{" "}
              {matchingEditJob.generatedCount}, failed{" "}
              {matchingEditJob.failedCount})
            </Text>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <Message label={label} color="blood" onLabelClick={clearError}>
          {error}
        </Message>
      ) : null}
    </div>
  );
};
