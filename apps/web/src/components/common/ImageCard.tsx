import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Label, type LabelVariant } from "./Label";

interface ImageCardProps {
  imageUrl: string;
  imageAlt?: string;
  label: ReactNode;
  labelVariant?: LabelVariant;
  className?: string;
}

export const ImageCard = ({
  imageUrl,
  imageAlt = "",
  label,
  labelVariant = "gold",
  className = "",
}: ImageCardProps): JSX.Element => {
  return (
    <div
      className={cn(
        "relative aspect-[3/2] w-full max-w-[30rem] overflow-visible rounded-sm border-2 border-kac-iron bg-kac-iron-dark shadow-[3px_3px_0_0_#121b23]",
        className,
      )}
    >
      <img
        src={imageUrl}
        alt={imageAlt}
        aria-hidden={imageAlt.length === 0 ? "true" : undefined}
        className="h-full w-full rounded-[1px] object-cover"
      />

      <div
        data-image-card-label
        className="pointer-events-none absolute -bottom-1 left-3 z-10"
      >
        <Label color={labelVariant} className="max-w-[calc(100%-1.5rem)] leading-tight">
          {label}
        </Label>
      </div>
    </div>
  );
};
