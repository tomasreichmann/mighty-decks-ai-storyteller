import { type PropsWithChildren } from "react";
import { cn } from "../../utils/cn";

export type TagTone =
  | "gold"
  | "fire"
  | "bone"
  | "skin"
  | "cloth"
  | "curse"
  | "monster"
  | "steel"
  | "iron"
  | "blood";

const tagToneClassMap: Record<TagTone, string> = {
  gold:
    "bg-gradient-to-br from-kac-gold-light via-kac-gold to-kac-gold-darker text-kac-iron",
  fire:
    "bg-gradient-to-br from-[#ffd1b3] via-kac-fire-light to-kac-fire-dark text-kac-curse-lightest",
  bone:
    "bg-gradient-to-br from-[#fff1da] via-kac-bone-light to-kac-bone-darker text-kac-iron-dark",
  skin:
    "bg-gradient-to-br from-[#ffe4e8] via-kac-skin-light to-kac-skin-dark text-kac-blood-dark",
  cloth:
    "bg-gradient-to-br from-[#7db4ef] via-kac-cloth to-[#173e6b] text-kac-steel-light",
  curse:
    "bg-gradient-to-br from-kac-curse-lightest via-kac-curse-light to-kac-curse-dark text-kac-curse-lightest",
  monster:
    "bg-gradient-to-br from-kac-monster-lightest via-kac-monster-light to-kac-monster-dark text-kac-iron-dark",
  steel:
    "bg-gradient-to-br from-kac-steel-light via-kac-steel to-kac-steel-dark text-kac-iron-dark",
  iron:
    "bg-gradient-to-br from-kac-steel-light via-kac-iron-light to-kac-iron-dark text-kac-steel-light",
  blood:
    "bg-gradient-to-br from-[#ff8d8d] via-kac-blood-light to-kac-blood-dark text-kac-curse-lightest",
};

interface TagProps extends PropsWithChildren {
  tone?: TagTone;
  size?: "sm" | "md";
  className?: string;
}

const sizeClassMap: Record<NonNullable<TagProps["size"]>, string> = {
  sm: "px-2 py-0.5 text-[10px]/none",
  md: "px-2.5 py-1 text-xs/none",
};

export const Tag = ({
  tone = "cloth",
  size = "md",
  className,
  children,
}: TagProps): JSX.Element => {
  return (
    <span
      className={cn(
        "inline-flex items-stretch overflow-hidden rounded-md",
        "border border-kac-iron",
        "shadow-[0_1px_0_#090f15,0_3px_7px_rgba(0,0,0,0.25)]",
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex items-center",
          "font-heading font-bold uppercase tracking-[0.06em]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
          "[text-shadow:0_1px_0_rgba(0,0,0,0.35)]",
          sizeClassMap[size],
          tagToneClassMap[tone],
        )}
      >
        {children}
      </span>
    </span>
  );
};
