import React from "react";
import type { ReactNode } from "react";
import { Label } from "../common/Label";
import { cn } from "../../utils/cn";

void React;

interface LocationCardProps {
  imageUrl: string;
  imageAlt?: string;
  title: ReactNode;
  description: ReactNode;
  className?: string;
}

export const LocationCard = ({
  imageUrl,
  imageAlt = "",
  title,
  description,
  className = "",
}: LocationCardProps): JSX.Element => {
  return (
    <div
      className={cn(
        "relative h-[200px] w-[300px] max-w-full overflow-hidden rounded-sm border-2 border-kac-iron bg-kac-iron-dark shadow-[4px_4px_0_0_#121b23]",
        className,
      )}
    >
      <img
        src={imageUrl}
        alt={imageAlt}
        aria-hidden={imageAlt.length === 0 ? "true" : undefined}
        className="h-full w-full rounded-[2px] object-cover"
      />

      <div className="pointer-events-none absolute left-3 top-3 right-3 z-10">
        <Label
          variant="gold"
          size="lg"
          className="max-w-[70%] whitespace-normal break-words text-left leading-tight normal-case tracking-normal"
        >
          {title}
        </Label>
      </div>

      <div className="pointer-events-none absolute bottom-3 right-3 left-3 z-10 flex justify-end">
        <Label
          variant="bone"
          size="md"
          rotate={false}
          className="max-w-[16rem] whitespace-normal break-words text-left leading-snug normal-case tracking-normal"
        >
          {description}
        </Label>
      </div>
    </div>
  );
};
