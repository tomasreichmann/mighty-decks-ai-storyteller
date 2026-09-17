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

const inactiveSurfaceClassMap: Record<ToggleButtonColor, string> = {
  gold: "hover:!bg-kac-gold/20 focus-visible:!bg-kac-gold/20",
  fire: "hover:!bg-kac-fire/15 focus-visible:!bg-kac-fire/15",
  monster: "hover:!bg-kac-monster/15 focus-visible:!bg-kac-monster/15",
  cloth: "hover:!bg-kac-cloth/15 focus-visible:!bg-kac-cloth/15",
  bone: "hover:!bg-kac-bone-dark/15 focus-visible:!bg-kac-bone-dark/15",
  curse: "hover:!bg-kac-curse/15 focus-visible:!bg-kac-curse/15",
};

const activeSurfaceClassMap: Record<ToggleButtonColor, string> = {
  gold: "!bg-kac-gold !text-kac-iron",
  fire: "!bg-kac-fire !text-kac-bone-light",
  monster: "!bg-kac-monster !text-kac-iron-dark",
  cloth: "!bg-kac-cloth !text-kac-bone-light",
  bone: "!bg-kac-bone !text-kac-iron-dark",
  curse: "!bg-kac-curse !text-kac-bone-light",
};

export const buttonRadioGroupRailClassName =
  "button-radio-group inline-flex w-fit max-w-full items-stretch overflow-hidden rounded-[0.3rem] border-2 border-kac-iron bg-kac-bone shadow-[3px_3px_0_0_#2F3D4E]";

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
    "relative min-w-0 flex-none rounded-none !border-0 !border-r !border-r-kac-iron/45 !bg-kac-bone !px-4 !text-kac-iron !translate-y-0 !shadow-none last:!border-r-0",
    !disabled && "hover:z-20 focus-visible:z-30",
    disabled && "pointer-events-none !opacity-45 hover:z-auto focus-visible:z-auto active:!translate-y-0",
    active
      ? cn(
          "z-10 !border-2 !border-kac-iron -my-px !shadow-[1px_1px_0_0_#2F3D4E]",
          activeSurfaceClassMap[color],
        )
      : inactiveSurfaceClassMap[color],
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
  size = "md",
  value,
}: ButtonRadioGroupProps<Value>): JSX.Element => {
  return (
    <div
      aria-label={ariaLabel}
      className={cn(buttonRadioGroupRailClassName, className)}
      role="radiogroup"
    >
      <div className="flex min-w-0 flex-wrap items-stretch">
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
    </div>
  );
};
