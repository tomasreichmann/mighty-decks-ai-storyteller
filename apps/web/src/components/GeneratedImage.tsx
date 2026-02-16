import { resolveServerUrl } from "../lib/socket";
import { cn } from "../utils/cn";
import { Button } from "./common/Button";
import type { MessageColor } from "./common/Message";
import { Text } from "./common/Text";
import { PendingIndicator } from "./PendingIndicator";

export interface ImageGeneration {
  imageId: string;
  imageUrl: string;
  alt?: string;
}

interface GeneratedImageProps {
  image: ImageGeneration | null;
  batch?: ImageGeneration[];
  onChange?: (image: ImageGeneration) => void;
  pending?: boolean;
  pendingLabel?: string;
  pendingColor?: MessageColor;
  emptyLabel?: string;
  embedded?: boolean;
  className?: string;
}

const toImageSrc = (imageUrl: string): string => {
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("data:")
  ) {
    return imageUrl;
  }

  return new URL(imageUrl, resolveServerUrl()).toString();
};

const resolveCurrentBatchIndex = (
  image: ImageGeneration | null,
  batch: ImageGeneration[],
): number => {
  if (!image || batch.length === 0) {
    return -1;
  }

  const byIdIndex = batch.findIndex(
    (candidate) => candidate.imageId === image.imageId,
  );
  if (byIdIndex >= 0) {
    return byIdIndex;
  }

  return batch.findIndex((candidate) => candidate.imageUrl === image.imageUrl);
};

export const GeneratedImage = ({
  image,
  batch,
  onChange,
  pending = false,
  pendingLabel = "Generating image...",
  pendingColor,
  emptyLabel = "No image selected.",
  embedded = false,
  className = "",
}: GeneratedImageProps): JSX.Element => {
  const normalizedBatch = batch ?? [];
  const currentBatchIndex = resolveCurrentBatchIndex(image, normalizedBatch);
  const hasBatchNavigation = normalizedBatch.length > 1 && currentBatchIndex >= 0;
  const canNavigate = hasBatchNavigation && typeof onChange === "function";
  const resolvedPendingColor = pendingColor ?? (embedded ? "cloth-dark" : "gold");

  const selectBatchIndex = (targetIndex: number): void => {
    if (!canNavigate || !onChange) {
      return;
    }

    const boundedIndex = Math.max(
      0,
      Math.min(normalizedBatch.length - 1, targetIndex),
    );
    const nextImage = normalizedBatch[boundedIndex];
    if (nextImage) {
      onChange(nextImage);
    }
  };

  return (
    <div className={cn(embedded ? "h-full w-full" : "stack gap-2", className)}>
      <div
        className={cn(
          "relative overflow-hidden",
          embedded
            ? "h-full w-full"
            : "aspect-video border-2 border-kac-iron bg-kac-iron-dark",
        )}
      >
        {image ? (
          <img
            src={toImageSrc(image.imageUrl)}
            alt={image.alt ?? "Generated image"}
            className="h-full w-full object-cover"
          />
        ) : pending ? (
          <div className="flex h-full w-full items-center justify-center px-4">
            <PendingIndicator label={pendingLabel} color={resolvedPendingColor} />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center px-4">
            <Text variant="body" color="steel-light" className="text-sm text-center">
              {emptyLabel}
            </Text>
          </div>
        )}

        {hasBatchNavigation ? (
          <>
            <div className="absolute left-2 top-1/2 -translate-y-1/2">
              <Button
                variant="circle"
                color="cloth"
                size="sm"
                onClick={() => selectBatchIndex(currentBatchIndex - 1)}
                disabled={!canNavigate || currentBatchIndex <= 0}
              >
                {"<"}
              </Button>
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Button
                variant="circle"
                color="cloth"
                size="sm"
                onClick={() => selectBatchIndex(currentBatchIndex + 1)}
                disabled={
                  !canNavigate || currentBatchIndex >= normalizedBatch.length - 1
                }
              >
                {">"}
              </Button>
            </div>
          </>
        ) : null}
      </div>

      {hasBatchNavigation && !embedded ? (
        <div className="flex items-center justify-center gap-2">
          {normalizedBatch.map((batchImage, index) => {
            const isCurrent = index === currentBatchIndex;
            return (
              <button
                key={`${batchImage.imageId}-${index}`}
                type="button"
                onClick={() => selectBatchIndex(index)}
                disabled={!canNavigate}
                className={cn(
                  "h-3 w-3 rounded-full border-2 border-kac-iron transition",
                  isCurrent ? "bg-kac-gold" : "bg-kac-bone",
                  !canNavigate && "opacity-60 cursor-not-allowed",
                )}
                aria-label={`Select batch image ${index + 1}`}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
