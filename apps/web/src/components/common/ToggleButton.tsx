import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../utils/cn";

export type ToggleButtonColor =
  | "gold"
  | "fire"
  | "monster"
  | "cloth"
  | "bone"
  | "curse";

export type ToggleButtonSize = "s" | "m" | "l";

export interface ToggleButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  color?: ToggleButtonColor;
  size?: ToggleButtonSize;
}

const sizeClassMap: Record<ToggleButtonSize, string> = {
  s: "min-h-8 px-3 py-1.5 text-xs",
  m: "min-h-10 px-4 py-2 text-sm",
  l: "min-h-12 px-5 py-2.5 text-base",
};

const inactiveColorClassMap: Record<ToggleButtonColor, string> = {
  gold: "border-kac-gold-dark bg-kac-bone-light/80 text-kac-iron hover:bg-kac-gold/45",
  fire: "border-kac-fire-dark bg-kac-bone-light/80 text-kac-iron hover:bg-kac-fire-light/35",
  monster:
    "border-kac-monster-dark bg-kac-bone-light/80 text-kac-iron hover:bg-kac-monster-light/35",
  cloth:
    "border-kac-cloth-dark bg-kac-steel-light/85 text-kac-iron hover:bg-kac-cloth-light/35",
  bone: "border-kac-bone-dark bg-kac-bone-light text-kac-iron hover:bg-kac-bone/70",
  curse:
    "border-kac-curse-dark bg-kac-bone-light/80 text-kac-iron hover:bg-kac-curse-light/25",
};

const activeColorClassMap: Record<ToggleButtonColor, string> = {
  gold: "border-kac-gold-dark bg-gradient-to-b from-kac-gold to-kac-gold-dark text-kac-iron",
  fire: "border-kac-fire-dark bg-gradient-to-b from-kac-fire-light to-kac-fire-dark text-kac-bone-light",
  monster:
    "border-kac-monster-dark bg-gradient-to-b from-kac-monster-light to-kac-monster-dark text-kac-iron-dark",
  cloth:
    "border-kac-cloth-dark bg-gradient-to-b from-kac-cloth-light to-kac-cloth-dark text-kac-steel-light",
  bone: "border-kac-bone-dark bg-gradient-to-b from-kac-bone-light to-kac-bone-dark text-kac-iron-dark",
  curse:
    "border-kac-curse-dark bg-gradient-to-b from-kac-curse-light to-kac-curse-dark text-kac-curse-lightest",
};

export const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(
  (
    {
      active = false,
      className,
      color = "gold",
      disabled,
      size = "m",
      type = "button",
      ...props
    },
    ref,
  ) => {
    const classes = cn(
      "inline-flex select-none items-center justify-center rounded-sm border-2",
      "font-ui font-bold uppercase tracking-[0.08em] transition duration-100",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/50",
      "disabled:cursor-not-allowed disabled:saturate-50 disabled:contrast-75 disabled:brightness-90",
      sizeClassMap[size],
      active
        ? "translate-y-[1px] shadow-[inset_0_2px_0_rgba(255,255,255,0.25),inset_0_-2px_0_rgba(0,0,0,0.28),1px_1px_0_0_#121b23]"
        : "shadow-[inset_0_1px_0_rgba(255,255,255,0.22),3px_3px_0_0_#121b23]",
      active ? activeColorClassMap[color] : inactiveColorClassMap[color],
      className,
    );

    return (
      <button
        {...props}
        ref={ref}
        aria-pressed={active}
        className={classes}
        disabled={disabled}
        type={type}
      />
    );
  },
);

ToggleButton.displayName = "ToggleButton";
