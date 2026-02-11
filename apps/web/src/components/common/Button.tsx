import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClassMap: Record<ButtonVariant, string> = {
  primary: "bg-gradient-to-b from-kac-gold to-kac-gold-dark text-kac-iron",
  secondary:
    "bg-gradient-to-b from-kac-cloth-light to-kac-cloth-dark text-kac-steel-light",
  ghost: "bg-gradient-to-b from-kac-bone-light to-kac-bone text-kac-iron-dark",
  danger:
    "bg-gradient-to-b from-kac-fire-light to-kac-fire-dark text-kac-fire-lightest",
};

const sizeClassMap: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      type = "button",
      ...props
    },
    ref,
  ) => {
    const classes = cn(
      "inline-flex select-none items-center justify-center border-[3px] border-b-[6px] border-kac-iron",
      "font-ui font-bold uppercase tracking-[0.08em] transition duration-100",
      "shadow-[3px_3px_0_0_#121b23]",
      "hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/50",
      "active:translate-y-[2px] active:border-b-[4px] active:shadow-[1px_1px_0_0_#121b23]",
      "disabled:cursor-not-allowed disabled:opacity-55 disabled:brightness-100 disabled:translate-y-0 disabled:border-b-[6px] disabled:shadow-[3px_3px_0_0_#121b23]",
      variantClassMap[variant],
      sizeClassMap[size],
      className,
    );

    return <button ref={ref} type={type} className={classes} {...props} />;
  },
);

Button.displayName = "Button";
