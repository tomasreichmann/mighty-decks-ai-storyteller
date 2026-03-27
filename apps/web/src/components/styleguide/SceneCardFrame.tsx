import React from "react";
import type { ReactNode } from "react";
import type { LabelVariant } from "../common/Label";
import { Label } from "../common/Label";
import { cn } from "../../utils/cn";

void React;

interface SceneCardFrameProps {
  imageUrl: string;
  imageAlt?: string;
  title: ReactNode;
  typeLabel: ReactNode;
  typeVariant: LabelVariant;
  description: ReactNode;
  className?: string;
}

export const SceneCardFrame = ({
  imageUrl,
  imageAlt = "",
  title,
  typeLabel,
  typeVariant,
  description,
  className = "",
}: SceneCardFrameProps): JSX.Element => {
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

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-kac-iron-dark/15 via-kac-iron-dark/5 to-kac-iron-dark/60" />

      <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[72%]">
        <Label
          variant="gold"
          size="lg"
          className="whitespace-normal break-words text-left leading-tight normal-case tracking-normal"
        >
          {title}
        </Label>
      </div>

      <div className="pointer-events-none absolute right-3 top-3 z-10">
        <Label
          variant={typeVariant}
          size="sm"
          rotate={false}
          className="normal-case tracking-normal"
        >
          {typeLabel}
        </Label>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 z-10 w-full">
        <Label
          variant="bone"
          size="md"
          rotate={false}
          className="w-full justify-start whitespace-normal break-words rounded-none border-x-0 border-b-0 px-3 py-2 text-left leading-snug normal-case tracking-normal shadow-none"
        >
          {description}
        </Label>
      </div>
    </div>
  );
};
