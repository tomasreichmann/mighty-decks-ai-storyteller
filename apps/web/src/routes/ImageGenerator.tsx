import { useMemo, useState } from "react";
import type { GeneratedImageAsset } from "@mighty-decks/spec/imageGeneration";
import {
  GeneratedImage,
  type ImageGeneration,
} from "../components/GeneratedImage";
import { Button } from "../components/common/Button";
import {
  ContextMenu,
  type ContextMenuRow,
} from "../components/common/ContextMenu";
import { Heading } from "../components/common/Heading";
import { Label } from "../components/common/Label";
import { Message } from "../components/common/Message";
import { RockerSwitch } from "../components/common/RockerSwitch";
import { Section } from "../components/common/Section";
import { SectionBoundary } from "../components/common/SectionBoundary";
import { Text } from "../components/common/Text";
import { PendingIndicator } from "../components/PendingIndicator";
import { TextArea } from "../components/common/TextArea";
import { TextField } from "../components/common/TextField";
import {
  IMAGE_RESOLUTION_PRESETS,
  useImageGeneration,
} from "../hooks/useImageGeneration";

const SELECT_CLASSES =
  "w-full min-h-[42px] border-2 border-kac-iron rounded-sm bg-gradient-to-b from-[#f8efd8] to-[#e5d4b9] px-3 py-2 text-sm text-kac-iron font-ui shadow-[inset_2px_2px_0_0_#9f8a6d,inset_-2px_-2px_0_0_#fff7e6]";

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

const FieldSticker = ({ children }: { children: string }): JSX.Element => (
  <div className="-mb-2 -ml-1 relative self-start z-20">
    <Label>{children}</Label>
  </div>
);

export const ImageGenerator = (): JSX.Element => {
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
    <div className="app-shell stack py-6 gap-4">
      <Section className="stack gap-2 paper-shadow">
        <Heading
          level="h1"
          color="iron"
          className="relative z-0 text-[2.4rem] leading-none sm:text-[3.4rem] sm:leading-none"
          highlightProps={{
            color: "gold",
            lineHeight: 8,
            brushHeight: 6,
            lineOffsets: [0, 8, 14, 20],
            className:
              "left-1/2 bottom-[0.08em] h-[0.5em] w-[calc(100%+0.22em)] -translate-x-1/2",
          }}
        >
          Image Lab
        </Heading>
        <Text
          variant="body"
          color="iron-light"
          className="relative z-10 mt-3 text-sm"
        >
          Standalone image generation tool with fal.ai and Leonardo providers.
        </Text>
      </Section>

      {error ? (
        <Message label="Error" color="blood" onLabelClick={clearError}>
          {error}
        </Message>
      ) : null}

      <SectionBoundary
        resetKey={`${provider}-${selectedModelId}-${resolutionPresetId}`}
        title="Image controls failed to render"
        message="The image generation controls crashed while rendering. You can still inspect the gallery or refresh the page."
        className="stack gap-4"
      >
        <Section className="stack gap-4">
          <TextArea
            label="Prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={4}
            maxLength={4000}
            showCharCount={true}
            placeholder="Describe the scene you want to generate..."
          />

        <div className="flex flex-wrap items-end gap-3">
          <label className="stack max-w-[14rem] min-w-[11rem] flex-1 gap-1">
            <FieldSticker>Provider</FieldSticker>
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

          <label className="stack min-w-[16rem] flex-[1.6] gap-1 xl:max-w-[34rem]">
            <FieldSticker>Model</FieldSticker>
            <div className="grid gap-2 min-[420px]:grid-cols-[minmax(0,1fr)_auto] min-[420px]:items-end">
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
                className="shrink-0 min-[420px]:self-end"
              >
                {selectedModelIsFavorite ? "Unfavorite" : "Favorite"}
              </Button>
            </div>
          </label>
        </div>

        <div
          className={
            resolutionPresetId === "custom"
              ? "grid gap-3 xl:grid-cols-[minmax(0,13rem)_minmax(0,8rem)_minmax(0,8rem)_minmax(0,8rem)]"
              : "grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,13rem)_minmax(0,8rem)]"
          }
        >
          <label className="stack gap-1 xl:max-w-[13rem]">
            <FieldSticker>Resolution</FieldSticker>
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

          <TextField
            label="Amount"
            type="number"
            min={1}
            max={8}
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
            className="xl:max-w-[8rem]"
          />

          {resolutionPresetId === "custom" ? (
            <>
              <TextField
                label="Custom Width"
                type="number"
                min={64}
                max={4096}
                value={customWidth}
                onChange={(event) => setCustomWidth(event.target.value)}
                className="xl:max-w-[8rem]"
              />
              <TextField
                label="Custom Height"
                type="number"
                min={64}
                max={4096}
                value={customHeight}
                onChange={(event) => setCustomHeight(event.target.value)}
                className="xl:max-w-[8rem]"
              />
            </>
          ) : null}
        </div>

        <div>
          <RockerSwitch
            active={useCache}
            color="gold"
            size="sm"
            label="Use Cache"
            inactiveText="Disabled"
            activeText="Enabled"
            onClick={() => setUseCache(!useCache)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            color="cloth"
            onClick={() => {
              void lookupCurrentGroup();
            }}
            disabled={refreshingGroup || submittingJob}
          >
            {refreshingGroup ? (
              <PendingIndicator label="Looking up" color="cloth" />
            ) : (
              "Lookup Existing"
            )}
          </Button>
          <Button
            color="gold"
            onClick={() => {
              void submitJob();
            }}
            disabled={loadingModels || submittingJob}
          >
            {submittingJob ? (
              <PendingIndicator label="Generating" color="gold" />
            ) : (
              "Generate"
            )}
          </Button>
        </div>
        </Section>
      </SectionBoundary>

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

      <SectionBoundary
        resetKey={activeImage?.imageId ?? "image-preview"}
        title="Image preview failed to render"
        message="The selected image preview crashed while rendering. You can still work with the gallery below."
        className="stack gap-3"
      >
        <Section className="stack gap-3">
          <GeneratedImage
            image={activeImage ? toDisplayImage(activeImage) : null}
            batch={activeBatchImages.map(toDisplayImage)}
            onChange={(nextImage) => {
              void selectActiveImage(nextImage.imageId);
            }}
          />
        </Section>
      </SectionBoundary>

      <SectionBoundary
        resetKey={activeImage?.imageId ?? selectedModelId}
        title="Image gallery failed to render"
        message="The image gallery crashed while rendering. You can still generate new images above or reload the page."
        className="stack gap-3"
      >
        <Section className="stack gap-3">
          {sortedImages.length === 0 ? (
            <Message label="Image Gallery" color="cloth">
              No images in this prompt/model group yet.
            </Message>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sortedImages.map((image) => {
                const isActive = group?.activeImageId === image.imageId;
                const menuRows: ContextMenuRow[] = [
                  {
                    kind: "action",
                    id: "delete-image",
                    label: "Delete Image",
                    className:
                      "text-kac-blood-dark border-kac-blood-dark/65 hover:bg-kac-blood-light/15",
                    onSelect: () => {
                      if (window.confirm("Delete this image?")) {
                        void deleteImage(image.imageId);
                      }
                    },
                  },
                  {
                    kind: "action",
                    id: "delete-batch",
                    label: "Delete Batch",
                    className:
                      "text-kac-blood-dark border-kac-blood-dark/65 hover:bg-kac-blood-light/15",
                    onSelect: () => {
                      if (
                        window.confirm(
                          `Delete batch ${image.batchIndex} and all of its images?`,
                        )
                      ) {
                        void deleteBatch(image.batchIndex);
                      }
                    },
                  },
                ];

                return (
                  <div
                    key={image.imageId}
                    className="relative border-2 border-kac-iron bg-kac-bone-light p-2"
                  >
                    <div className="absolute left-2 top-2 z-10">
                      <ContextMenu
                        rows={menuRows}
                        direction="bottom"
                        align="start"
                        open={menuImageId === image.imageId}
                        onOpenChange={(nextOpen) => {
                          setMenuImageId(nextOpen ? image.imageId : null);
                        }}
                      />
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
        </Section>
      </SectionBoundary>
    </div>
  );
};
