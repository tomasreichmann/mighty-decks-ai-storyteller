import type { CSSProperties } from "react";
import { cn } from "../utils/cn";
import { GeneratedImage, type ImageGeneration } from "./GeneratedImage";

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
      <div className="absolute inset-0 overflow-hidden -m-1 bg-kac-iron-dark skew-clip-mask">
        <div
          className="absolute inset-0 -m-3 bg-ink skew-clip-mask skew-clip-border"
          style={skewStyle}
        ></div>
        <div
          className="absolute inset-0 m-3 bg-kac-bone skew-clip-mask"
          style={skewStyle}
        ></div>
        <div
          className="absolute inset-[2px] overflow-hidden m-3 bg-kac-iron-dark skew-clip-mask"
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
          <div className="halftone-vignette-wrapper !z-50 !mix-blend-multiply">
            <div className="halftone-vignette"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
