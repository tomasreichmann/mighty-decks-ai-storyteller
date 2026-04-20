import React from "react";
import { PropsWithChildren } from "react";
import { cn } from "../../utils/cn";
import { componentLabelSizeClassMap, type ComponentSize } from "./componentSizing";

void React;

export type LabelColor =
  | "gold"
  | "fire"
  | "blood"
  | "bone"
  | "steel"
  | "skin"
  | "cloth"
  | "curse"
  | "monster";

export type LabelVariant = LabelColor;

const labelToneClassMap: Record<LabelColor, string> = {
  gold: "bg-kac-gold text-kac-iron",
  fire: "bg-kac-fire-light text-kac-iron-dark",
  blood: "bg-kac-blood-light text-kac-iron-dark",
  bone: "bg-kac-bone-light text-kac-iron-dark",
  steel: "bg-kac-steel-light text-kac-iron-dark",
  skin: "bg-kac-skin text-kac-iron-dark",
  cloth: "bg-kac-cloth-light text-kac-iron-dark",
  curse: "bg-kac-curse-light text-kac-iron-dark",
  monster: "bg-kac-monster-light text-kac-iron-dark",
};

const labelSizeClassMap: Record<ComponentSize, string> = componentLabelSizeClassMap;

interface LabelProps extends PropsWithChildren {
  color?: LabelColor;
  size?: ComponentSize;
  rotate?: boolean;
  className?: string;
}

export const Label = ({
  color = "gold",
  size = "md",
  rotate = true,
  className = "",
  children,
}: LabelProps): JSX.Element => {
  return (
    <span
      className={cn(
        "label inline-flex w-fit self-start items-center border-2 border-kac-iron",
        labelSizeClassMap[size],
        "font-heading text-xs/none font-bold uppercase tracking-wide",
        "shadow-[3px_3px_0_0_#121b23]",
        rotate && "-rotate-[1.5deg]",
        labelToneClassMap[color],
        className,
      )}
    >
      {children}
    </span>
  );
};
