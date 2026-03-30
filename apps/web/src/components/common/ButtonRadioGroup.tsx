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
      className={cn("flex flex-wrap items-center gap-0", className)}
      role="radiogroup"
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <ToggleButton
            key={option.value}
            active={isActive}
            aria-checked={isActive}
            color={color}
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
  );
};
