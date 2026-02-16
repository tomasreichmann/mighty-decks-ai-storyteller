import { useMemo, useState } from "react";
import type { GeneratedImageAsset } from "@mighty-decks/spec/imageGeneration";
import { useNavigate } from "react-router-dom";
import {
  GeneratedImage,
  type ImageGeneration,
} from "../components/GeneratedImage";
import { Button } from "../components/common/Button";
import { Heading } from "../components/common/Heading";
import { DepressedInput } from "../components/common/DepressedInput";
import { Message } from "../components/common/Message";
import { Panel } from "../components/common/Panel";
import { Section } from "../components/common/Section";
import { Text } from "../components/common/Text";
import {
  IMAGE_RESOLUTION_PRESETS,
  useImageGeneration,
} from "../hooks/useImageGeneration";

const SELECT_CLASSES =
  "w-full border-2 border-kac-iron rounded-sm bg-gradient-to-b from-[#f8efd8] to-[#e5d4b9] px-3 py-2 text-kac-iron font-ui";

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
  alt: `Generated image b${image.batchIndex} i${image.imageIndex}`,
});

export const ImageGenerator = (): JSX.Element => {
  const navigate = useNavigate();
  const [menuImageId, setMenuImageId] = useState<string | null>(null);
  const {
    provider,
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
  } = useImageGeneration();

  const selectedModelIsFavorite = useMemo(
    () => favoriteModelIds.includes(selectedModelId),
    [favoriteModelIds, selectedModelId],
  );

  const sortedImages = useMemo(
    () => (group ? sortImages(group.images) : []),
    [group],
  );
  const activeImage = useMemo(
    () =>
      group?.activeImageId
        ? sortedImages.find((candidate) => candidate.imageId === group.activeImageId)
        : sortedImages[0],
    [group?.activeImageId, sortedImages],
  );
  const activeBatchImages = useMemo(() => {
    if (!activeImage) {
      return [];
    }

    return sortedImages.filter(
      (candidate) => candidate.batchIndex === activeImage.batchIndex,
    );
  }, [activeImage, sortedImages]);

  return (
    <main className="app-shell stack py-6 gap-4">
      <Section className="stack gap-2 paper-shadow">
        <div className="flex items-center justify-between gap-2">
          <Heading as="h1" variant="h2" color="iron" className="z-10">
            Image Generator
          </Heading>
          <Button variant="ghost" color="cloth" onClick={() => navigate("/")}>
            Back
          </Button>
        </div>
        <Text variant="emphasised" color="iron-light" className="text-sm">
          Standalone image generation tool with fal.ai and Leonardo providers.
        </Text>
      </Section>

      {error ? (
        <Message label="Error" color="blood" onLabelClick={clearError}>
          {error}
        </Message>
      ) : null}

      <Panel className="stack gap-3">
        <Text variant="h3" color="iron">
          Generate
        </Text>
        <DepressedInput
          label="Prompt"
          multiline={true}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={4}
          maxLength={4000}
          showCharCount={true}
          placeholder="Describe the scene you want to generate..."
        />

        <label className="stack gap-1">
          <Text variant="note" color="iron" className="text-base">
            Provider
          </Text>
          <select
            className={SELECT_CLASSES}
            value={provider}
            onChange={(event) =>
              setProvider(event.target.value as "fal" | "leonardo")
            }
            disabled={loadingModels || submittingJob}
          >
            <option value="fal">fal.ai</option>
            <option value="leonardo">Leonardo</option>
          </select>
        </label>

        <label className="stack gap-1">
          <Text variant="note" color="iron" className="text-base">
            Model
          </Text>
          <div className="flex gap-2">
            <select
              className={SELECT_CLASSES}
              value={selectedModelId}
              onChange={(event) => setSelectedModelId(event.target.value)}
              disabled={loadingModels}
            >
              {sortedModels.map((model) => {
                const isFavorite = favoriteModelIds.includes(model.modelId);
                const isStreamVariant = /\/stream(?:$|\/)/i.test(model.modelId);
                return (
                  <option key={model.modelId} value={model.modelId}>
                    {isFavorite ? "[Favorite] " : ""}
                    {model.displayName}
                    {isStreamVariant ? " [stream]" : ""}
                    {" - "}
                    {model.modelId}
                  </option>
                );
              })}
            </select>
            <Button
              variant={selectedModelIsFavorite ? "solid" : "ghost"}
              color={selectedModelIsFavorite ? "gold" : "cloth"}
              onClick={() => toggleFavorite(selectedModelId)}
              disabled={selectedModelId.length === 0}
            >
              {selectedModelIsFavorite ? "Unfavorite" : "Favorite"}
            </Button>
          </div>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="stack gap-1">
            <Text variant="note" color="iron" className="text-base">
              Resolution
            </Text>
            <select
              className={SELECT_CLASSES}
              value={resolutionPresetId}
              onChange={(event) => setResolutionPresetId(event.target.value)}
            >
              {IMAGE_RESOLUTION_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>
          </label>

          <DepressedInput
            label="Amount"
            type="number"
            min={1}
            max={8}
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
          />
        </div>

        {resolutionPresetId === "custom" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <DepressedInput
              label="Custom Width"
              type="number"
              min={64}
              max={4096}
              value={customWidth}
              onChange={(event) => setCustomWidth(event.target.value)}
            />
            <DepressedInput
              label="Custom Height"
              type="number"
              min={64}
              max={4096}
              value={customHeight}
              onChange={(event) => setCustomHeight(event.target.value)}
            />
          </div>
        ) : null}

        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={useCache}
            onChange={(event) => setUseCache(event.target.checked)}
          />
          <Text variant="body" color="iron-light" className="text-sm">
            Use cache
          </Text>
        </label>

        <Text variant="body" color="steel-dark" className="text-xs">
          Resolved resolution: {resolvedResolution.width} x{" "}
          {resolvedResolution.height}
        </Text>

        <div className="flex flex-wrap gap-2">
          <Button
            color="cloth"
            onClick={() => {
              void lookupCurrentGroup();
            }}
            disabled={refreshingGroup || submittingJob}
          >
            {refreshingGroup ? "Loading..." : "Lookup Existing"}
          </Button>
          <Button
            color="gold"
            onClick={() => {
              void submitJob();
            }}
            disabled={loadingModels || submittingJob}
          >
            {submittingJob ? "Generating..." : "Generate"}
          </Button>
        </div>
      </Panel>

      {job ? (
        <Message label="Generation Progress" color="gold">
          <Text variant="body" color="iron-light" className="text-sm">
            Status: {job.status} | completed {job.succeededCount}/{job.totalRequested}
            {" "}
            (cached {job.cachedCount}, generated {job.generatedCount}, failed {job.failedCount})
          </Text>
          <Text variant="body" color="iron-light" className="text-xs mt-2">
            {job.items
              .map(
                (item) =>
                  `#${item.requestIndex}: ${item.status}${item.error ? ` (${item.error})` : ""}`,
              )
              .join(" | ")}
          </Text>
        </Message>
      ) : null}

      <Panel className="stack gap-3">
        <Text variant="h3" color="iron">
          Active Image
        </Text>
        <GeneratedImage
          image={activeImage ? toDisplayImage(activeImage) : null}
          batch={activeBatchImages.map(toDisplayImage)}
          onChange={(nextImage) => {
            void selectActiveImage(nextImage.imageId);
          }}
        />
      </Panel>

      <Panel className="stack gap-3">
        <Text variant="h3" color="iron">
          Image Gallery
        </Text>
        {sortedImages.length === 0 ? (
          <Text variant="body" color="steel-dark" className="text-sm">
            No images in this prompt/model group yet.
          </Text>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sortedImages.map((image) => {
              const isActive = group?.activeImageId === image.imageId;
              const showMenu = menuImageId === image.imageId;

              return (
                <div
                  key={image.imageId}
                  className="relative border-2 border-kac-iron bg-kac-bone-light p-2"
                >
                  <div className="absolute left-2 top-2 z-10">
                    <Button
                      size="sm"
                      variant="circle"
                      color="cloth"
                      onClick={() =>
                        setMenuImageId((current) =>
                          current === image.imageId ? null : image.imageId,
                        )
                      }
                    >
                      ...
                    </Button>
                    {showMenu ? (
                      <div className="mt-1 min-w-[150px] border-2 border-kac-iron bg-kac-bone-light p-2 shadow-[2px_2px_0_0_#121b23]">
                        <Button
                          variant="ghost"
                          color="blood"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => {
                            setMenuImageId(null);
                            if (window.confirm("Delete this image?")) {
                              void deleteImage(image.imageId);
                            }
                          }}
                        >
                          Delete Image
                        </Button>
                        <Button
                          variant="ghost"
                          color="blood"
                          size="sm"
                          className="w-full justify-start mt-1"
                          onClick={() => {
                            setMenuImageId(null);
                            if (
                              window.confirm(
                                `Delete batch ${image.batchIndex} and all of its images?`,
                              )
                            ) {
                              void deleteBatch(image.batchIndex);
                            }
                          }}
                        >
                          Delete Batch
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      void selectActiveImage(image.imageId);
                    }}
                    className="w-full text-left"
                  >
                    <GeneratedImage
                      image={toDisplayImage(image)}
                      className="pointer-events-none"
                    />
                  </button>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <Text variant="body" color="iron-light" className="text-xs">
                      b{image.batchIndex} / i{image.imageIndex}
                    </Text>
                    <Button
                      size="sm"
                      variant={isActive ? "solid" : "ghost"}
                      color={isActive ? "gold" : "cloth"}
                      onClick={() => {
                        void selectActiveImage(image.imageId);
                      }}
                    >
                      {isActive ? "Active" : "Set Active"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </main>
  );
};
