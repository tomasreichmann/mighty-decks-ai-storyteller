import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";
import { cn } from "../../utils/cn";
import { Label, type LabelVariant } from "./Label";

export type RockerSwitchColor =
  | "gold"
  | "fire"
  | "monster"
  | "cloth"
  | "bone"
  | "curse";

export type RockerSwitchSize = "sm" | "md" | "lg";

export interface RockerSwitchProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  color?: RockerSwitchColor;
  size?: RockerSwitchSize;
  label?: ReactNode;
  labelVariant?: LabelVariant;
  activeText?: ReactNode;
  inactiveText?: ReactNode;
}

const sizeClassMap: Record<RockerSwitchSize, string> = {
  sm: "min-h-8 min-w-[4.5rem] px-3 py-1.5 text-xs",
  md: "min-h-10 min-w-[5.5rem] px-4 py-2 text-sm",
  lg: "min-h-12 min-w-[6.5rem] px-5 py-2.5 text-base",
};

const labelOffsetClassMap: Record<RockerSwitchSize, string> = {
  sm: "self-center translate-y-[0.08rem] -mr-2",
  md: "self-center translate-y-[0.1rem] -mr-2.5",
  lg: "self-center translate-y-[0.14rem] -mr-3",
};

const inactiveColorClassMap: Record<RockerSwitchColor, string> = {
  gold:
    "border-kac-gold-dark bg-[linear-gradient(270deg,#fdf1cd_0%,#fdf1cd_40%,#ead7aa_60%,#c7ac77_100%)] text-kac-iron-dark",
  fire:
    "border-kac-fire-dark bg-[linear-gradient(270deg,#f6dbc0_0%,#f6dbc0_40%,#dfb68b_60%,#b98558_100%)] text-kac-iron-dark",
  monster:
    "border-[#245420] bg-[linear-gradient(270deg,#cfe4c6_0%,#cfe4c6_40%,#9ec199_60%,#6a8d63_100%)] text-kac-iron-dark",
  cloth:
    "border-kac-cloth-dark bg-[linear-gradient(270deg,#d5e0ea_0%,#d5e0ea_40%,#acc0d1_60%,#72889d_100%)] text-kac-iron-dark",
  bone:
    "border-kac-bone-dark bg-[linear-gradient(270deg,#f4e8d1_0%,#f4e8d1_40%,#ddc9ab_60%,#b49a7d_100%)] text-kac-iron-dark",
  curse:
    "border-kac-curse-dark bg-[linear-gradient(270deg,#f2d2e1_0%,#f2d2e1_40%,#d7a8c1_60%,#966b85_100%)] text-kac-iron-dark",
};

const activeColorClassMap: Record<RockerSwitchColor, string> = {
  gold:
    "border-kac-gold-dark bg-[linear-gradient(270deg,#f0b62a_0%,#f0b62a_40%,#ffcf38_60%,#ffe89b_100%)] text-kac-iron",
  fire:
    "border-kac-fire-dark bg-[linear-gradient(270deg,#b64b14_0%,#b64b14_40%,#ef6a00_60%,#ffbf61_100%)] text-kac-iron-dark",
  monster:
    "border-[#245420] bg-[linear-gradient(270deg,#2c7a22_0%,#2c7a22_40%,#2faf39_60%,#7cdd79_100%)] text-kac-iron-dark",
  cloth:
    "border-kac-cloth-dark bg-[linear-gradient(270deg,#476987_0%,#476987_40%,#6f97bb_60%,#bdd9ee_100%)] text-kac-iron-dark",
  bone:
    "border-kac-bone-dark bg-[linear-gradient(270deg,#aa7f54_0%,#aa7f54_40%,#dcb992_60%,#fce8c9_100%)] text-kac-iron-dark",
  curse:
    "border-kac-curse-dark bg-[linear-gradient(270deg,#9a2c72_0%,#9a2c72_40%,#db005f_60%,#ff89c4_100%)] text-kac-iron-dark",
};

const undersideFaceColorClassMap: Record<RockerSwitchColor, string> = {
  gold: "bg-kac-gold-darker",
  fire: "bg-kac-fire-dark",
  monster: "bg-[#245420]",
  cloth: "bg-kac-cloth-dark",
  bone: "bg-kac-bone-darker",
  curse: "bg-kac-curse-dark",
};

const labelVariantByColor: Record<RockerSwitchColor, LabelVariant> = {
  gold: "gold",
  fire: "fire",
  monster: "monster",
  cloth: "cloth",
  bone: "bone",
  curse: "curse",
};

export const RockerSwitch = forwardRef<HTMLButtonElement, RockerSwitchProps>(
  (
    {
      active = false,
      children,
      className,
      color = "gold",
      disabled,
      label,
      labelVariant,
      activeText,
      inactiveText,
      size = "md",
      type = "button",
      ...props
    },
    ref,
  ) => {
    const visibleText = active ? activeText : inactiveText;
    const hasDualText =
      activeText !== undefined || inactiveText !== undefined;

    return (
      <div className="rocker-switch inline-flex items-center">
        {label ? (
          <div className={cn("relative z-0 shrink-0", labelOffsetClassMap[size])}>
            <Label
              color={labelVariant ?? labelVariantByColor[color]}
              size={size}
              rotate={false}
              className="pr-4 -mr-2 shadow-none"
            >
              {label}
            </Label>
          </div>
        ) : null}

        <div className="relative z-10 inline-flex px-2 [perspective:700px] [perspective-origin:center_center]">
          <button
            {...props}
            ref={ref}
            aria-pressed={active}
            className={cn(
              "relative z-10 inline-flex select-none items-center justify-center overflow-visible rounded-sm border-2",
              "font-ui font-bold uppercase tracking-[0.08em] [transform-style:preserve-3d] [transform-origin:center_center]",
              "transition-[transform,filter,box-shadow] duration-150 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/50",
              "disabled:cursor-not-allowed disabled:saturate-50 disabled:contrast-75 disabled:brightness-90",
              sizeClassMap[size],
              active
                ? "[transform:translateZ(2px)_rotateY(20deg)]"
                : "[transform:translateZ(2px)_rotateY(-20deg)]",
              active ? activeColorClassMap[color] : inactiveColorClassMap[color],
              className,
            )}
            disabled={disabled}
            type={type}
          >
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute -top-[2px] -bottom-[2px] left-full w-6 [transform-origin:left_center] [transform:perspective(700px)_rotateY(90deg)]",
                undersideFaceColorClassMap[color],
              )}
            />
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute -top-[2px] -bottom-[2px] right-full w-6 [transform-origin:right_center] [transform:perspective(700px)_rotateY(-90deg)]",
                undersideFaceColorClassMap[color],
              )}
            />

            {hasDualText ? (
              <span className="relative z-10 grid place-items-center [text-shadow:0_1px_0_rgba(255,255,255,0.45),0_-1px_0_rgba(255,255,255,0.2)]">
                <span className="col-start-1 row-start-1 opacity-0">
                  {inactiveText ?? activeText}
                </span>
                <span className="col-start-1 row-start-1 opacity-0">
                  {activeText ?? inactiveText}
                </span>
                <span className="col-start-1 row-start-1">
                  {visibleText}
                </span>
              </span>
            ) : (
              <span className="relative z-10 [text-shadow:0_1px_0_rgba(255,255,255,0.45),0_-1px_0_rgba(255,255,255,0.2)]">
                {children}
              </span>
            )}
          </button>
        </div>
      </div>
    );
  },
);

RockerSwitch.displayName = "RockerSwitch";
