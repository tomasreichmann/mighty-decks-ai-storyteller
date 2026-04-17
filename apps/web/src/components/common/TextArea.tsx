import type { ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import {
  FieldShell,
  fieldControlBaseClassName,
  fieldControlDepthClassName,
  fieldControlStateClassName,
} from "./FieldShell";
import type { LabelColor } from "./Label";
import { componentSurfaceSizeClassMap, type ComponentSize } from "./componentSizing";

interface TextAreaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
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

export const TextArea = ({
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
}: TextAreaProps): JSX.Element => {
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
      <textarea
        id={inputId}
        className={cn(
          fieldControlBaseClassName,
          fieldControlDepthClassName,
          fieldControlStateClassName,
          "resize-y",
          componentSurfaceSizeClassMap[size],
          className,
          controlClassName,
        )}
        {...props}
      />
    </FieldShell>
  );
};
