import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../utils/cn";

export type ButtonVariant = "solid" | "ghost" | "circle";
export type ButtonColors =
  | "steel"
  | "steel-light"
  | "steel-dark"
  | "iron"
  | "iron-light"
  | "iron-dark"
  | "blood"
  | "blood-light"
  | "blood-lighter"
  | "blood-lightest"
  | "blood-dark"
  | "fire"
  | "fire-light"
  | "fire-lightest"
  | "fire-dark"
  | "bone"
  | "bone-light"
  | "bone-dark"
  | "bone-darker"
  | "skin"
  | "skin-light"
  | "skin-dark"
  | "gold"
  | "gold-light"
  | "gold-dark"
  | "gold-darker"
  | "cloth"
  | "cloth-light"
  | "cloth-lightest"
  | "cloth-dark"
  | "curse"
  | "curse-light"
  | "curse-lighter"
  | "curse-lightest"
  | "curse-dark"
  | "monster"
  | "monster-light"
  | "monster-lightest"
  | "monster-dark";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  color?: ButtonColors;
  size?: ButtonSize;
}

const variantClassMap: Record<ButtonVariant, string> = {
  solid: cn(
    "border-x-[2px] border-y-[2px] border-kac-iron rounded-sm",
    "hover:translate-y-[2px] active:translate-y-[4px] disabled:translate-y-0 ",
    "rotate-[-2deg] hover:rotate-[0deg] active:rotate-[0deg] disabled:rotate-[-2deg]",
    "skew-x-[-5deg]",
    "shadow-[3px_3px_0_0_#121b23] hover:shadow-[2px_2px_0_0_#121b23] active:shadow-[1px_1px_0_0_#121b23] disabled:shadow-[3px_3px_0_0_#121b23]",
    "bg-gradient-to-b disabled:bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.25)_0px,rgba(0,0,0,0.25)_10px,transparent_10px,transparent_20px)]",
  ),
  ghost:
    "border-2 border-kac-iron/60 bg-transparent shadow-none active:translate-y-[1px] active:shadow-none disabled:shadow-none disabled:border-kac-iron/35 disabled:bg-transparent",
  circle:
    "rounded-full bg-gradient-to-b border-x-[3px] border-y-[2px] border-kac-iron shadow-[3px_3px_0_0_#121b23] active:translate-y-[2px] active:border-b-[4px] active:shadow-[1px_1px_0_0_#121b23] disabled:translate-y-0 disabled:border-b-[6px] disabled:shadow-[3px_3px_0_0_#121b23] disabled:bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.25)_0px,rgba(0,0,0,0.25)_10px,transparent_10px,transparent_20px)]",
};

const sizeClassMap: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

const circleSizeClassMap: Record<ButtonSize, string> = {
  sm: "h-8 w-8 p-0 text-xs",
  md: "h-10 w-10 p-0 text-sm",
  lg: "h-12 w-12 p-0 text-base",
};

const resolveSolidColorClasses = (color: ButtonColors): string => {
  switch (color) {
    case "cloth":
    case "cloth-light":
      return "[background-color:black] bg-gradient-to-b from-kac-cloth-light to-kac-cloth-dark text-kac-steel-light disabled:bg-kac-cloth-light";
    case "cloth-dark":
      return "[background-color:black] bg-gradient-to-b from-kac-cloth to-kac-cloth-dark text-kac-steel-light disabled:bg-kac-cloth";
    case "bone":
    case "bone-light":
      return "[background-color:black] bg-gradient-to-b from-kac-bone-light to-kac-bone text-kac-iron-dark disabled:bg-kac-bone-light";
    case "bone-dark":
    case "bone-darker":
      return "[background-color:black] bg-gradient-to-b from-kac-bone to-kac-bone-darker text-kac-iron-dark disabled:bg-kac-bone";
    case "curse":
    case "curse-light":
    case "curse-lighter":
    case "curse-lightest":
    case "curse-dark":
      return "[background-color:black] bg-gradient-to-b from-kac-curse-light to-kac-curse-dark text-kac-curse-lightest disabled:bg-kac-curse-light";
    case "blood":
    case "blood-light":
    case "blood-lighter":
    case "blood-lightest":
    case "blood-dark":
      return "[background-color:black] bg-gradient-to-b from-kac-blood-light to-kac-blood-dark text-kac-curse-lightest disabled:bg-kac-blood-light";
    case "monster":
    case "monster-light":
    case "monster-lightest":
    case "monster-dark":
      return "[background-color:black] bg-gradient-to-b from-kac-monster-light to-kac-monster-dark text-kac-iron-dark disabled:bg-kac-monster-light";
    case "fire":
    case "fire-light":
    case "fire-lightest":
    case "fire-dark":
      return "[background-color:black] bg-gradient-to-b from-kac-fire-light to-kac-fire-dark text-kac-bone-light disabled:bg-kac-fire-light";
    case "iron":
    case "iron-light":
    case "iron-dark":
      return "[background-color:black] bg-gradient-to-b from-kac-iron-light to-kac-iron-dark text-kac-steel-light disabled:bg-kac-iron-light";
    case "steel":
    case "steel-light":
    case "steel-dark":
      return "[background-color:black] bg-gradient-to-b from-kac-steel-light to-kac-steel-dark text-kac-iron-dark disabled:bg-kac-steel-light";
    case "gold":
    case "gold-light":
    case "gold-dark":
    case "gold-darker":
      return "[background-color:black] bg-gradient-to-b from-kac-gold to-kac-gold-dark text-kac-iron disabled:bg-kac-gold";
    case "skin":
    case "skin-light":
    case "skin-dark":
      return "[background-color:black] bg-gradient-to-b from-kac-skin-light to-kac-skin-dark text-kac-iron-dark disabled:bg-kac-skin-light";
    default:
      return "[background-color:black] bg-gradient-to-b from-kac-gold to-kac-gold-dark text-kac-iron disabled:bg-kac-gold";
  }
};

const resolveGhostColorClasses = (color: ButtonColors): string => {
  switch (color) {
    case "cloth":
    case "cloth-light":
    case "cloth-dark":
      return "text-kac-cloth-dark border-kac-cloth-dark/70 hover:bg-kac-cloth-light/25";
    case "bone":
    case "bone-light":
    case "bone-dark":
    case "bone-darker":
      return "text-kac-iron-dark border-kac-bone-dark/70 hover:bg-kac-bone-light/45";
    case "curse":
    case "curse-light":
    case "curse-lighter":
    case "curse-lightest":
    case "curse-dark":
      return "text-kac-curse-dark border-kac-curse-dark/70 hover:bg-kac-curse-light/20";
    case "blood":
    case "blood-light":
    case "blood-lighter":
    case "blood-lightest":
    case "blood-dark":
      return "text-kac-blood-dark border-kac-blood-dark/65 hover:bg-kac-blood-light/15";
    case "monster":
    case "monster-light":
    case "monster-lightest":
    case "monster-dark":
      return "text-kac-monster-dark border-kac-monster-dark/65 hover:bg-kac-monster-light/25";
    case "gold":
    case "gold-light":
    case "gold-dark":
    case "gold-darker":
      return "text-kac-gold-darker border-kac-gold-dark/70 hover:bg-kac-gold-light/40";
    case "iron":
    case "iron-light":
    case "iron-dark":
      return "text-kac-iron-light border-kac-iron/60 hover:bg-kac-steel-light/30";
    case "skin":
    case "skin-light":
    case "skin-dark":
      return "text-kac-blood-dark border-kac-skin-dark/65 hover:bg-kac-skin-light/35";
    case "steel":
    case "steel-light":
    case "steel-dark":
    default:
      return "text-kac-iron border-kac-steel-dark/70 hover:bg-kac-steel-light/40";
  }
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "solid",
      color = "gold",
      size = "md",
      type = "button",
      ...props
    },
    ref,
  ) => {
    const colorClasses =
      variant === "ghost"
        ? resolveGhostColorClasses(color)
        : resolveSolidColorClasses(color);
    const sizeClasses =
      variant === "circle" ? circleSizeClassMap[size] : sizeClassMap[size];

    const classes = cn(
      "inline-flex select-none items-center justify-center",
      "font-ui font-bold uppercase tracking-[0.08em] transition duration-100",
      "hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/50",
      "disabled:cursor-not-allowed disabled:brightness-100 disabled:saturate-50 disabled:contrast-75 disabled:brightness-75",
      variantClassMap[variant],
      colorClasses,
      sizeClasses,
      className,
    );

    return <button ref={ref} type={type} className={classes} {...props} />;
  },
);

Button.displayName = "Button";
