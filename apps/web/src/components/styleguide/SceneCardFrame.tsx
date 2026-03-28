import React from "react";
import type { ReactNode } from "react";
import { Label } from "../common/Label";
import { cn } from "../../utils/cn";

void React;

interface SceneCardFrameProps {
  imageUrl: string;
  imageAlt?: string;
  title: ReactNode;
  titleVariant?: "gold" | "fire" | "cloth";
  typeIcon: ReactNode;
  description: ReactNode;
  className?: string;
}

export const SceneCardFrame = ({
  imageUrl,
  imageAlt = "",
  title,
  titleVariant = "gold",
  typeIcon,
  description,
  className = "",
}: SceneCardFrameProps): JSX.Element => {
  return (
    <div
      className={cn(
        "relative h-[168px] w-[252px] max-w-full overflow-hidden rounded-sm border-2 border-kac-iron bg-kac-iron-dark shadow-[4px_4px_0_0_#121b23]",
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
          variant={titleVariant}
          size="md"
          className="whitespace-normal break-words px-2.5 py-1.5 text-left leading-tight normal-case tracking-normal shadow-[2px_2px_0_0_#121b23]"
        >
          {title}
        </Label>
      </div>

      <div className="pointer-events-none absolute right-3 top-3 z-10">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-kac-iron bg-kac-bone-light/95 text-xl shadow-[2px_2px_0_0_#121b23]">
          <span aria-hidden="true">{typeIcon}</span>
        </span>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 z-10 w-full">
        <div className="w-full border-t-2 border-kac-iron bg-[#f7f3eb] px-3 py-2 text-left shadow-none">
          <p className="font-heading text-sm/[1.02] font-bold normal-case tracking-normal text-kac-iron-dark">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};
