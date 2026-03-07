import { useEffect, useMemo, useRef, useState } from "react";
import type {
  GeneratedImageAsset,
  ImageModelSummary,
} from "@mighty-decks/spec/imageGeneration";
import { useImageGeneration } from "../../hooks/useImageGeneration";
import { updateAdventureModuleCoverImage } from "../../lib/adventureModuleApi";
import { toMarkdownPlainTextSnippet } from "../../lib/markdownSnippet";
import { Button } from "../common/Button";
import { InputDescriptionHint } from "../common/InputDescriptionHint";
import { Label } from "../common/Label";
import { Message } from "../common/Message";
import { SmartInput } from "../common/SmartInput";
import { Tags } from "../common/Tags";
import { Text } from "../common/Text";
import { GeneratedImage, type ImageGeneration } from "../GeneratedImage";

const CONTEXT_TAG_OPTIONS = [
  "Module Title",
  "Module Summary",
  "Module Intent",
  "Premise",
  "Have Tags",
  "Avoid Tags",
  "Player Summary",
  "Player Info",
  "Storyteller Summary",
  "Storyteller Info",
] as const;

const DEFAULT_CONTEXT_TAGS: string[] = [
  "Module Title",
  "Premise",
  "Have Tags",
  "Avoid Tags",
  "Player Summary",
];

const SELECT_CLASSES =
  "w-full border-2 border-kac-iron rounded-sm bg-gradient-to-b from-[#f8efd8] to-[#e5d4b9] px-3 py-2 text-kac-iron font-ui";

const PROMPT_MAX_LENGTH = 4000;

const PREFERRED_FAST_MODEL_IDS = [
  "fal-ai/flux/schnell",
  "fal-ai/flux-1/schnell",
  "fal-ai/flux-2/flash",
  "fal-ai/fast-sdxl",
] as const;

interface AdventureModuleTitleImagePanelProps {
  moduleId: string;
  creatorToken?: string;
  moduleTitle: string;
  moduleSummary: string;
  moduleIntent: string;
  premise: string;
  haveTags: string[];
  avoidTags: string[];
  playerSummary: string;
  playerInfo: string;
  storytellerSummary: string;
  storytellerInfo: string;
  disabled?: boolean;
}

const normalizeWhitespace = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

const truncate = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }
  if (maxLength <= 3) {
    return value.slice(0, maxLength);
  }
  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
};

const toSnippet = (value: string, maxLength: number): string => {
  return toMarkdownPlainTextSnippet(value, maxLength).trim();
};

const toTagListSnippet = (values: string[], maxLength: number): string => {
  const normalizedValues = values
    .map((value) => normalizeWhitespace(value))
    .filter((value) => value.length > 0);
  if (normalizedValues.length === 0) {
    return "";
  }

  return truncate(normalizedValues.join(", "), maxLength);
};

const normalizePromptForMatch = (value: string): string =>
  value.trim().replace(/\s+/g, " ");

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

const resolveContextLines = (
  selectedContextTags: string[],
  props: AdventureModuleTitleImagePanelProps,
): string[] => {
  const lines: string[] = [];

  for (const selectedTag of selectedContextTags) {
    switch (selectedTag) {
      case "Module Title": {
        const snippet = toSnippet(props.moduleTitle, 120);
        if (snippet.length > 0) {
          lines.push(`Module title: ${snippet}`);
        }
        break;
      }
      case "Module Summary": {
        const snippet = toSnippet(props.moduleSummary, 300);
        if (snippet.length > 0) {
          lines.push(`Module summary: ${snippet}`);
        }
        break;
      }
      case "Module Intent": {
        const snippet = toSnippet(props.moduleIntent, 320);
        if (snippet.length > 0) {
          lines.push(`Authoring intent: ${snippet}`);
        }
        break;
      }
      case "Premise": {
        const snippet = toSnippet(props.premise, 500);
        if (snippet.length > 0) {
          lines.push(`Premise: ${snippet}`);
        }
        break;
      }
      case "Have Tags": {
        const snippet = toTagListSnippet(props.haveTags, 260);
        if (snippet.length > 0) {
          lines.push(`Preferred themes/tropes: ${snippet}`);
        }
        break;
      }
      case "Avoid Tags": {
        const snippet = toTagListSnippet(props.avoidTags, 260);
        if (snippet.length > 0) {
          lines.push(`Avoid these themes/tropes: ${snippet}`);
        }
        break;
      }
      case "Player Summary": {
        const snippet = toSnippet(props.playerSummary, 450);
        if (snippet.length > 0) {
          lines.push(`Player summary: ${snippet}`);
        }
        break;
      }
      case "Player Info": {
        const snippet = toSnippet(props.playerInfo, 500);
        if (snippet.length > 0) {
          lines.push(`Player info details: ${snippet}`);
        }
        break;
      }
      case "Storyteller Summary": {
        const snippet = toSnippet(props.storytellerSummary, 450);
        if (snippet.length > 0) {
          lines.push(`Storyteller summary: ${snippet}`);
        }
        break;
      }
      case "Storyteller Info": {
        const snippet = toSnippet(props.storytellerInfo, 500);
        if (snippet.length > 0) {
          lines.push(`Storyteller info details: ${snippet}`);
        }
        break;
      }
      default:
        break;
    }
  }

  return lines;
};

const buildComposedTitleImagePrompt = (
  userPrompt: string,
  contextLines: string[],
): string => {
  const normalizedPrompt = userPrompt.trim();
  if (contextLines.length === 0) {
    return truncate(normalizedPrompt, PROMPT_MAX_LENGTH);
  }
  const contextBlock = contextLines.map((line) => `- ${line}`).join("\n");
  const composedPrompt = `${normalizedPrompt}\n\nAdventure context:\n${contextBlock}`;
  return truncate(composedPrompt, PROMPT_MAX_LENGTH);
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

const toDisplayImage = (image: GeneratedImageAsset): ImageGeneration => ({
  imageId: image.imageId,
  imageUrl: image.fileUrl,
  alt: `Adventure title image b${image.batchIndex} i${image.imageIndex}`,
});

export const AdventureModuleTitleImagePanel = ({
  disabled = false,
  ...context
}: AdventureModuleTitleImagePanelProps): JSX.Element => {
  const [contextTags, setContextTags] =
    useState<string[]>(DEFAULT_CONTEXT_TAGS);
  const [preferredModelInitialized, setPreferredModelInitialized] =
    useState(false);
  const [coverPersistError, setCoverPersistError] = useState<string | null>(
    null,
  );
  const [coverPersisting, setCoverPersisting] = useState(false);
  const lastPersistedImageIdRef = useRef<string | null>(null);
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
    submitJob,
    selectActiveImage,
    clearError,
  } = useImageGeneration();

  const contextLines = useMemo(
    () => resolveContextLines(contextTags, { ...context, disabled }),
    [context, contextTags, disabled],
  );
  const composedPrompt = useMemo(
    () => buildComposedTitleImagePrompt(prompt, contextLines),
    [contextLines, prompt],
  );
  const smartInputWorkflowContextDescription = useMemo(() => {
    const lines = [
      "Title image prompt for adventure module cover art.",
      "Refine wording while preserving visual clarity and cinematic composition.",
    ];
    if (contextLines.length > 0) {
      lines.push("Selected module context:");
      for (const line of contextLines) {
        lines.push(`- ${line}`);
      }
    }
    return truncate(lines.join("\n"), 1000);
  }, [contextLines]);
  const hasContext = contextLines.length > 0;

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

  const matchingGroup = useMemo(() => {
    if (!group) {
      return null;
    }
    if (
      normalizePromptForMatch(group.prompt) !==
      normalizePromptForMatch(composedPrompt)
    ) {
      return null;
    }
    if (group.model !== selectedModelId) {
      return null;
    }
    return group;
  }, [composedPrompt, group, selectedModelId]);

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
      ? `Title image generation failed: ${failedReason}`
      : "Title image generation failed. Try adjusting context or regenerating.";
  const canRunActions =
    !disabled &&
    !loadingModels &&
    selectedModelId.trim().length > 0 &&
    hasPrompt &&
    !pending;

  useEffect(() => {
    lastPersistedImageIdRef.current = null;
    setCoverPersistError(null);
    setCoverPersisting(false);
  }, [context.moduleId]);

  useEffect(() => {
    if (disabled || !activeImage) {
      return;
    }
    if (activeImage.imageId === lastPersistedImageIdRef.current) {
      return;
    }

    let cancelled = false;
    const persistCoverImage = async (): Promise<void> => {
      setCoverPersisting(true);
      setCoverPersistError(null);
      try {
        await updateAdventureModuleCoverImage(
          context.moduleId,
          { coverImageUrl: activeImage.fileUrl },
          context.creatorToken,
        );
        if (cancelled) {
          return;
        }
        lastPersistedImageIdRef.current = activeImage.imageId;
      } catch (persistError) {
        if (cancelled) {
          return;
        }
        setCoverPersistError(
          persistError instanceof Error
            ? persistError.message
            : "Could not save module cover image.",
        );
      } finally {
        if (!cancelled) {
          setCoverPersisting(false);
        }
      }
    };

    void persistCoverImage();

    return () => {
      cancelled = true;
    };
  }, [activeImage, context.creatorToken, context.moduleId, disabled]);

  return (
    <div className="stack gap-3">
      <div className="relative z-40 flex min-h-6 flex-col items-stretch gap-2 md:flex-row md:items-start md:justify-between">
        <div className="-mb-2 -ml-1 relative self-start z-20 inline-flex items-center gap-2">
          <Label variant="gold">Title Image Prompt</Label>
          <InputDescriptionHint
            description="Edit the base prompt text. Selected context tags are appended for generation and lookup, but are not shown in this field."
            className="-translate-y-1 z-50"
          />
        </div>
        <Tags
          label="Title Image Context"
          value={contextTags}
          onChange={setContextTags}
          options={[...CONTEXT_TAG_OPTIONS]}
          allowCustom={false}
          addButtonLabel="Add Context"
          maxTags={CONTEXT_TAG_OPTIONS.length}
          placeholder="Search context..."
          disabled={disabled || pending}
          chrome="borderless"
          showLabel={false}
          showEmptyState={false}
          showCounter={false}
          className="md:ml-auto"
        />
      </div>

      <SmartInput
        label="Title Image Prompt"
        description="Base text used for title image generation."
        workflowContextDescription={smartInputWorkflowContextDescription}
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
            void lookupCurrentGroup(composedPrompt);
          }}
          disabled={!canRunActions || refreshingGroup}
        >
          {refreshingGroup ? "Loading..." : "Lookup Existing"}
        </Button>
        <Button
          color="gold"
          onClick={() => {
            void submitJob(composedPrompt);
          }}
          disabled={!canRunActions}
        >
          {pending ? "Generating..." : "Generate Title Image"}
        </Button>
      </div>

      {!hasContext ? (
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
        <Message label="Title Image" color="blood" onLabelClick={clearError}>
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
      {coverPersisting ? (
        <Text
          variant="note"
          color="iron-light"
          className="text-sm !opacity-100"
        >
          Saving as module cover image...
        </Text>
      ) : null}
      {coverPersistError ? (
        <Text variant="note" color="blood" className="text-sm !opacity-100">
          {coverPersistError}
        </Text>
      ) : null}

      <GeneratedImage
        image={activeImage ? toDisplayImage(activeImage) : null}
        batch={activeBatchImages.map(toDisplayImage)}
        onChange={(nextImage) => {
          void selectActiveImage(nextImage.imageId);
        }}
        pending={pending}
        failed={showFailedState}
        pendingLabel="Generating title image..."
        failedLabel={failedLabel}
        emptyLabel="No title image generated yet."
        implicitFailure={false}
      />
    </div>
  );
};
