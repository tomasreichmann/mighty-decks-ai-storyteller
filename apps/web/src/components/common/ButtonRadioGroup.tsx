import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import {
  ToggleButton,
  type ToggleButtonColor,
  type ToggleButtonSize,
} from "./ToggleButton";

export interface ButtonRadioGroupOption<Value extends string = string> {
  disabled?: boolean;
  label: ReactNode;
  value: Value;
}

const endCapAccentClassMap: Record<ToggleButtonColor, string> = {
  gold: "bg-kac-gold-dark",
  fire: "bg-kac-fire-dark",
  monster: "bg-kac-monster-dark",
  cloth: "bg-kac-cloth-dark",
  bone: "bg-kac-bone-dark",
  curse: "bg-kac-curse-dark",
};

const disabledAccentClassMap: Record<ToggleButtonColor, string> = {
  gold: "disabled:!bg-kac-gold-dark/55",
  fire: "disabled:!bg-kac-fire-dark/55",
  monster: "disabled:!bg-kac-monster-dark/55",
  cloth: "disabled:!bg-kac-cloth-dark/55",
  bone: "disabled:!bg-kac-bone-dark/55",
  curse: "disabled:!bg-kac-curse-dark/55",
};

const inactiveSurfaceClassMap: Record<ToggleButtonColor, string> = {
  gold:
    "!bg-kac-gold-light/80 !text-kac-iron hover:!bg-kac-gold-light focus-visible:!bg-kac-gold-light active:!bg-kac-gold/65",
  fire:
    "!bg-[#f7dcc7] !text-kac-iron hover:!bg-[#fbe6d6] focus-visible:!bg-[#fbe6d6] active:!bg-kac-fire-light/35",
  monster:
    "!bg-kac-monster-lightest/80 !text-kac-iron hover:!bg-kac-monster-lightest focus-visible:!bg-kac-monster-lightest active:!bg-kac-monster-light/45",
  cloth:
    "!bg-kac-cloth-lightest/85 !text-kac-iron hover:!bg-kac-cloth-lightest focus-visible:!bg-kac-cloth-lightest active:!bg-kac-cloth-light/35",
  bone:
    "!bg-[#f3e3cf] !text-kac-iron hover:!bg-[#f7ebda] focus-visible:!bg-[#f7ebda] active:!bg-kac-bone/55",
  curse:
    "!bg-[#f6d9e3] !text-kac-iron hover:!bg-[#fbe7ee] focus-visible:!bg-[#fbe7ee] active:!bg-kac-curse-light/35",
};

const activeSurfaceClassMap: Record<ToggleButtonColor, string> = {
  gold:
    "!bg-gradient-to-b !from-kac-gold !to-kac-gold-dark !text-kac-iron hover:!from-kac-gold-light hover:!to-kac-gold-dark focus-visible:!from-kac-gold-light focus-visible:!to-kac-gold-dark active:!from-kac-gold active:!to-kac-gold-darker",
  fire:
    "!bg-gradient-to-b !from-kac-fire-light !to-kac-fire-dark !text-kac-bone-light hover:!from-kac-fire-lightest hover:!to-kac-fire-dark focus-visible:!from-kac-fire-lightest focus-visible:!to-kac-fire-dark active:!from-kac-fire-light active:!to-kac-fire",
  monster:
    "!bg-gradient-to-b !from-kac-monster-light !to-kac-monster-dark !text-kac-iron-dark hover:!from-kac-monster-lightest hover:!to-kac-monster-dark focus-visible:!from-kac-monster-lightest focus-visible:!to-kac-monster-dark active:!from-kac-monster active:!to-kac-monster-dark",
  cloth:
    "!bg-gradient-to-b !from-kac-cloth-light !to-kac-cloth-dark !text-kac-steel-light hover:!from-kac-cloth-lightest hover:!to-kac-cloth-dark focus-visible:!from-kac-cloth-lightest focus-visible:!to-kac-cloth-dark active:!from-kac-cloth active:!to-kac-cloth-dark",
  bone:
    "!bg-gradient-to-b !from-kac-bone-light !to-kac-bone-dark !text-kac-iron-dark hover:!from-[#fff1da] hover:!to-kac-bone-dark focus-visible:!from-[#fff1da] focus-visible:!to-kac-bone-dark active:!from-kac-bone active:!to-kac-bone-darker",
  curse:
    "!bg-gradient-to-b !from-kac-curse-light !to-kac-curse-dark !text-kac-curse-lightest hover:!from-kac-curse-lighter hover:!to-kac-curse-dark focus-visible:!from-kac-curse-lighter focus-visible:!to-kac-curse-dark active:!from-kac-curse active:!to-kac-curse-dark",
};

export const buttonRadioGroupRailClassName =
  "inline-flex w-fit max-w-full items-stretch overflow-hidden rounded-[0.45rem] border-2 border-kac-iron/75 bg-kac-bone-light shadow-[4px_4px_0_0_#121b23]";

export const getButtonRadioGroupCapClassName = (
  color: ToggleButtonColor,
  side: "left" | "right",
): string =>
  cn(
    "w-[0.5em] flex-none",
    side === "left"
      ? "border-r border-r-kac-iron-dark/55"
      : "border-l border-l-kac-iron-dark/55",
    endCapAccentClassMap[color],
  );

export const getButtonRadioGroupSegmentClassName = ({
  active,
  color,
  disabled,
}: {
  active: boolean;
  color: ToggleButtonColor;
  disabled?: boolean;
}): string =>
  cn(
    "min-w-0 flex-none rounded-none !translate-y-0 !shadow-none !px-4",
    "-ml-px -mt-px border-2 border-kac-iron-dark/55",
    !disabled && "hover:z-20 focus-visible:z-30",
    disabled &&
      "pointer-events-none relative overflow-hidden hover:z-auto focus-visible:z-auto active:!translate-y-0",
    disabled &&
      "before:absolute before:inset-0 before:content-[''] before:bg-[repeating-linear-gradient(135deg,rgba(18,27,35,0.14)_0,rgba(18,27,35,0.14)_3px,transparent_3px,transparent_7px)]",
    disabled && disabledAccentClassMap[color],
    active ? activeSurfaceClassMap[color] : inactiveSurfaceClassMap[color],
  );

export interface ButtonRadioGroupProps<Value extends string = string> {
  ariaLabel?: string;
  className?: string;
  color?: ToggleButtonColor;
  name?: string;
  onValueChange: (value: Value) => void;
  options: ButtonRadioGroupOption<Value>[];
  size?: ToggleButtonSize;
  value: Value;
}

export const ButtonRadioGroup = <Value extends string = string>({
  ariaLabel,
  className,
  color = "gold",
  name,
  onValueChange,
  options,
  size = "m",
  value,
}: ButtonRadioGroupProps<Value>): JSX.Element => {
  return (
    <div
      aria-label={ariaLabel}
      className={cn(buttonRadioGroupRailClassName, className)}
      role="radiogroup"
    >
      <span
        aria-hidden="true"
        className={getButtonRadioGroupCapClassName(color, "left")}
      />
      <div className="flex min-w-0 flex-wrap items-stretch pl-px pt-px">
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <ToggleButton
            key={option.value}
            active={isActive}
            aria-checked={isActive}
            color={color}
            className={getButtonRadioGroupSegmentClassName({
              active: isActive,
              color,
              disabled: option.disabled,
            })}
            disabled={option.disabled}
            name={name}
            onClick={() => {
              if (!option.disabled && !isActive) {
                onValueChange(option.value);
              }
            }}
            role="radio"
            size={size}
            tabIndex={isActive ? 0 : -1}
          >
            {option.label}
          </ToggleButton>
        );
      })}
      </div>
      <span
        aria-hidden="true"
        className={getButtonRadioGroupCapClassName(color, "right")}
      />
    </div>
  );
};
