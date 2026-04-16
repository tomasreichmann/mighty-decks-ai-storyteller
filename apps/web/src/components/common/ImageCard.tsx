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
        "relative h-[200px] w-[300px] max-w-full overflow-visible rounded-sm border-2 border-kac-iron bg-kac-iron-dark shadow-[4px_4px_0_0_#121b23]",
        className,
      )}
    >
      <img
        src={imageUrl}
        alt={imageAlt}
        aria-hidden={imageAlt.length === 0 ? "true" : undefined}
        className="h-full w-full rounded-[2px] object-cover"
      />

      <div className="pointer-events-none absolute -bottom-2 -right-2 z-10">
        <Label color={labelVariant} className="max-w-[230px] text-right leading-tight">
          {label}
        </Label>
      </div>
    </div>
  );
};
