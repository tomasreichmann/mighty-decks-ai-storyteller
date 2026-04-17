import type { PropsWithChildren, ReactNode } from "react";
import { cn } from "../../utils/cn";
import { InputDescriptionHint } from "./InputDescriptionHint";
import { Label, type LabelColor } from "./Label";
import type { ComponentSize } from "./componentSizing";
import styles from "./FieldShell.module.css";

export const fieldControlBaseClassName =
  "relative block w-full border-2 border-kac-iron rounded-sm bg-gradient-to-b from-[#f8efd8] to-[#e5d4b9] text-kac-iron outline-none transition duration-100 font-ui";

export const fieldControlDepthClassName =
  "shadow-[inset_2px_2px_0_0_#9f8a6d,inset_-2px_-2px_0_0_#fff7e6]";

export const fieldControlStateClassName =
  "placeholder:text-kac-steel-dark/70 disabled:cursor-not-allowed disabled:opacity-60";

const toCharacterString = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.join("");
  }

  return "";
};

const resolveCharacterCountClassName = (
  characterCount: number,
  maxLength?: number,
): string => {
  if (typeof maxLength !== "number" || maxLength <= 0) {
    return "text-black";
  }

  const usageRatio = characterCount / maxLength;
  if (usageRatio >= 1) {
    return "text-kac-blood";
  }

  if (usageRatio >= 0.75) {
    return "text-kac-fire-dark";
  }

  return "text-black";
};

const buildCharacterCountLabel = (
  characterCount: number,
  maxLength?: number,
): string => {
  if (typeof maxLength === "number" && maxLength > 0) {
    return `${characterCount} / ${maxLength} characters`;
  }

  return `${characterCount} characters`;
};

export interface FieldShellProps extends PropsWithChildren {
  label: string;
  color?: LabelColor;
  size?: ComponentSize;
  id?: string;
  description?: string;
  showLabel?: boolean;
  showCharCount?: boolean;
  value?: unknown;
  defaultValue?: unknown;
  maxLength?: number;
  topRightControl?: ReactNode;
}

export const FieldShell = ({
  label,
  color = "gold",
  size = "md",
  id,
  description,
  showLabel = true,
  showCharCount = false,
  value,
  defaultValue,
  maxLength,
  topRightControl,
  children,
}: FieldShellProps): JSX.Element => {
  const fallbackId = label.toLowerCase().replace(/\s+/g, "-");
  const inputId = id ?? fallbackId;
  const characterCount = toCharacterString(value ?? defaultValue).length;
  const characterCountLabel = buildCharacterCountLabel(
    characterCount,
    maxLength,
  );
  const characterCountClassName = resolveCharacterCountClassName(
    characterCount,
    maxLength,
  );

  return (
    <label
      htmlFor={inputId}
      className="field-shell flex flex-col gap-1 text-sm text-kac-iron-light"
    >
      {showLabel ? (
        <div className="-mb-2 -ml-1 relative self-start z-20 inline-flex items-center gap-2">
          <Label color={color} size={size}>
            {label}
          </Label>
          {description ? (
            <InputDescriptionHint
              description={description}
              className="-translate-y-1"
            />
          ) : null}
        </div>
      ) : null}

      <div className={styles.focusHighlightWrapper}>
        {children}
        <div className={styles.focusHighlight}></div>
        {topRightControl ? (
          <div className="absolute right-2 top-2 z-30">{topRightControl}</div>
        ) : null}
      </div>

      {showCharCount ? (
        <p
          className={cn(
            "mt-0.5 text-xs font-ui leading-none tracking-normal",
            characterCountClassName,
          )}
        >
          {characterCountLabel}
        </p>
      ) : null}
    </label>
  );
};
