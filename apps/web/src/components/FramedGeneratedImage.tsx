import type { CSSProperties } from "react";
import { cn } from "../utils/cn";
import { GeneratedImage, type ImageGeneration } from "./GeneratedImage";
import styles from "./FramedGeneratedImage.module.css";

interface FramedGeneratedImageProps {
  image: ImageGeneration | null;
  batch?: ImageGeneration[];
  onChange?: (image: ImageGeneration) => void;
  pending?: boolean;
  pendingLabel?: string;
  failed?: boolean;
  failedLabel?: string;
  emptyLabel?: string;
  className?: string;
  aspectClassName?: string;
}

export const FramedGeneratedImage = ({
  image,
  batch,
  onChange,
  pending = false,
  pendingLabel = "Generating image...",
  failed = false,
  failedLabel = "Image generation failed. Continue without an image for this beat.",
  emptyLabel = "No image yet.",
  className = "",
  aspectClassName = "aspect-video",
}: FramedGeneratedImageProps): JSX.Element => {
  const skewStyle = { "--skew-offset": "4%" } as CSSProperties;

  return (
    <div className={cn("relative", aspectClassName, className)}>
      <div
        className={cn(
          styles.skewClipMask,
          "absolute inset-0 overflow-hidden -m-1 bg-kac-iron-dark",
        )}
      >
        <div
          className={cn(
            styles.skewClipMask,
            styles.skewClipBorder,
            "absolute inset-0 -m-3 bg-ink",
          )}
          style={skewStyle}
        ></div>
        <div
          className={cn(
            styles.skewClipMask,
            "absolute inset-0 m-3 bg-kac-bone",
          )}
          style={skewStyle}
        ></div>
        <div
          className={cn(
            styles.skewClipMask,
            "absolute inset-[2px] overflow-hidden m-3 bg-kac-iron-dark",
          )}
          style={skewStyle}
        >
          <GeneratedImage
            embedded
            image={image}
            batch={batch}
            onChange={onChange}
            pending={pending}
            pendingLabel={pendingLabel}
            failed={failed}
            failedLabel={failedLabel}
            emptyLabel={emptyLabel}
            className="absolute inset-0"
          />
          <div className={styles.halftoneVignetteWrapper}>
            <div className={styles.halftoneVignette}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
