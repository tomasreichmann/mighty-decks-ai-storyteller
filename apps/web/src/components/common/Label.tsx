import { PropsWithChildren } from "react";
import { cn } from "../../utils/cn";

export type LabelVariant =
  | "gold"
  | "fire"
  | "bone"
  | "skin"
  | "cloth"
  | "curse"
  | "monster";

const labelToneClassMap: Record<LabelVariant, string> = {
  gold: "bg-kac-gold text-kac-iron",
  fire: "bg-kac-fire-light text-kac-iron-dark",
  bone: "bg-kac-bone-light text-kac-iron-dark",
  skin: "bg-kac-skin text-kac-iron-dark",
  cloth: "bg-kac-cloth-light text-kac-iron-dark",
  curse: "bg-kac-curse-light text-kac-iron-dark",
  monster: "bg-kac-monster-light text-kac-iron-dark",
};

interface LabelProps extends PropsWithChildren {
  variant?: LabelVariant;
  size?: "sm" | "md" | "lg";
  rotate?: boolean;
  className?: string;
}

export const Label = ({
  variant = "gold",
  rotate = true,
  size,
  className = "",
  children,
}: LabelProps): JSX.Element => {
  return (
    <span
      className={cn(
        "inline-flex items-center border-2 border-kac-iron px-2 pt-1.5 pb-1",
        "font-heading text-xs/none font-bold uppercase tracking-wide",
        "shadow-[3px_3px_0_0_#121b23]",
        rotate && "-rotate-[1.5deg]",
        size ? "text-" + size + "/[0.8]" : "",
        labelToneClassMap[variant],
        className,
      )}
    >
      {children}
    </span>
  );
};
