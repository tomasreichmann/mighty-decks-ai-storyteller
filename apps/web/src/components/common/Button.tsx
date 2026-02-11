import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClassMap: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-b from-kac-gold to-kac-gold-dark text-kac-iron disabled:bg-kac-gold-dark disabled:bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.25)_0px,rgba(0,0,0,0.25)_10px,transparent_10px,transparent_20px)]",
  secondary:
    "bg-gradient-to-b from-kac-cloth-light to-kac-cloth-dark text-kac-steel-light disabled:bg-kac-cloth-dark disabled:bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.25)_0px,rgba(0,0,0,0.25)_10px,transparent_10px,transparent_20px)]",
  ghost:
    "bg-gradient-to-b from-kac-bone-light to-kac-bone text-kac-iron-dark disabled:bg-kac-bone-dark disabled:bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.25)_0px,rgba(0,0,0,0.25)_10px,transparent_10px,transparent_20px)]",
  danger:
    "bg-gradient-to-b from-kac-curse-light to-kac-curse-dark text-kac-curse-lightest disabled:bg-kac-curse-dark disabled:bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.25)_0px,rgba(0,0,0,0.25)_10px,transparent_10px,transparent_20px)]",
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
      "disabled:cursor-not-allowed disabled:brightness-100 disabled:translate-y-0 disabled:border-b-[6px] disabled:shadow-[3px_3px_0_0_#121b23] disabled:saturate-50 disabled:contrast-75 disabled:brightness-75",
      variantClassMap[variant],
      sizeClassMap[size],
      className,
    );

    return <button ref={ref} type={type} className={classes} {...props} />;
  },
);

Button.displayName = "Button";
