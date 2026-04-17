import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";
import {
  FieldShell,
  fieldControlBaseClassName,
  fieldControlDepthClassName,
  fieldControlStateClassName,
} from "./FieldShell";
import type { LabelColor } from "./Label";
import { componentSurfaceSizeClassMap, type ComponentSize } from "./componentSizing";

interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "className"> {
  label: string;
  description?: string;
  size?: ComponentSize;
  color?: LabelColor;
  className?: string;
  controlClassName?: string;
  showLabel?: boolean;
  showCharCount?: boolean;
  topRightControl?: ReactNode;
}

export const TextField = ({
  label,
  description,
  id,
  size = "md",
  color = "gold",
  className = "",
  controlClassName = "",
  showLabel = true,
  showCharCount = false,
  topRightControl,
  ...props
}: TextFieldProps): JSX.Element => {
  const fallbackId = label.toLowerCase().replace(/\s+/g, "-");
  const inputId = id ?? fallbackId;

  return (
    <FieldShell
      label={label}
      description={description}
      id={inputId}
      color={color}
      size={size}
      showLabel={showLabel}
      showCharCount={showCharCount}
      value={props.value}
      defaultValue={props.defaultValue}
      maxLength={props.maxLength}
      topRightControl={topRightControl}
    >
      <input
        id={inputId}
        className={cn(
          fieldControlBaseClassName,
          fieldControlDepthClassName,
          fieldControlStateClassName,
          componentSurfaceSizeClassMap[size],
          className,
          controlClassName,
        )}
        {...props}
      />
    </FieldShell>
  );
};
