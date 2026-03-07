import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import { Label, LabelVariant } from "./Label";
import { InputDescriptionHint } from "./InputDescriptionHint";
import styles from "./DepressedInput.module.css";

interface BaseDepressedInputProps {
  label: string;
  labelColor?: LabelVariant;
  id?: string;
  className?: string;
  controlClassName?: string;
  showCharCount?: boolean;
  showLabel?: boolean;
  description?: string;
  topRightControl?: ReactNode;
}

type DepressedSingleLineInputProps = BaseDepressedInputProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "id"> & {
    multiline?: false;
  };

type DepressedMultiLineInputProps = BaseDepressedInputProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className" | "id"> & {
    multiline: true;
  };

export type DepressedInputProps =
  | DepressedSingleLineInputProps
  | DepressedMultiLineInputProps;

const inputBaseClassName =
  "inputFocusHighlight relative w-full border-2 border-kac-iron rounded-sm bg-gradient-to-b from-[#f8efd8] to-[#e5d4b9] px-3 py-2 text-kac-iron outline-none transition duration-100 font-ui";

const inputDepthClassName =
  "shadow-[inset_2px_2px_0_0_#9f8a6d,inset_-2px_-2px_0_0_#fff7e6]";

const inputStateClassName =
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

export const DepressedInput = (props: DepressedInputProps): JSX.Element => {
  const {
    label,
    id,
    labelColor,
    className = "",
    controlClassName = "",
    showCharCount = false,
    showLabel = true,
    description,
    topRightControl,
  } = props;

  const fallbackId = label.toLowerCase().replace(/\s+/g, "-");
  const inputId = id ?? fallbackId;

  const labelClassName = cn(
    "flex flex-col gap-1 text-sm text-kac-iron-light",
    className,
  );
  const controlClasses = cn(
    inputBaseClassName,
    inputDepthClassName,
    inputStateClassName,
    controlClassName,
  );

  const labelElement = (
    <div className="-mb-2 -ml-1 relative self-start z-20 inline-flex items-center gap-2">
      <Label variant={labelColor}>{label}</Label>
      {description ? (
        <InputDescriptionHint
          description={description}
          className="-translate-y-1"
        />
      ) : null}
    </div>
  );

  if (props.multiline) {
    const {
      multiline,
      label: _ignoredLabel,
      id: _ignoredId,
      className: _ignoredClassName,
      controlClassName: _ignoredControlClassName,
      showCharCount: _ignoredShowCharCount,
      showLabel: _ignoredShowLabel,
      description: _ignoredDescription,
      topRightControl: _ignoredTopRightControl,
      ...textAreaProps
    } = props;
    const characterCount = toCharacterString(
      textAreaProps.value ?? textAreaProps.defaultValue,
    ).length;
    const characterCountLabel = buildCharacterCountLabel(
      characterCount,
      textAreaProps.maxLength,
    );
    const characterCountClassName = resolveCharacterCountClassName(
      characterCount,
      textAreaProps.maxLength,
    );

    return (
      <label htmlFor={inputId} className={labelClassName}>
        {showLabel ? labelElement : null}
        <div className={styles.focusHighlightWrapper}>
          <textarea
            id={inputId}
            className={cn(controlClasses, "resize-y")}
            {...textAreaProps}
          />
          <div className={styles.focusHighlight}></div>
          {topRightControl ? (
            <div className="absolute right-2 top-2 z-30">{topRightControl}</div>
          ) : null}
        </div>
        {showCharCount ? (
          <p
            className={cn(
              "text-xs font-ui leading-none tracking-normal mt-0.5",
              characterCountClassName,
            )}
          >
            {characterCountLabel}
          </p>
        ) : null}
      </label>
    );
  }

  const {
    label: _ignoredLabel,
    id: _ignoredId,
    className: _ignoredClassName,
    controlClassName: _ignoredControlClassName,
    showCharCount: _ignoredShowCharCount,
    showLabel: _ignoredShowLabel,
    description: _ignoredDescription,
    topRightControl: _ignoredTopRightControl,
    ...inputProps
  } = props;
  const characterCount = toCharacterString(
    inputProps.value ?? inputProps.defaultValue,
  ).length;
  const characterCountLabel = buildCharacterCountLabel(
    characterCount,
    inputProps.maxLength,
  );
  const characterCountClassName = resolveCharacterCountClassName(
    characterCount,
    inputProps.maxLength,
  );

  return (
    <label htmlFor={inputId} className={labelClassName}>
      {showLabel ? labelElement : null}
      <div className={styles.focusHighlightWrapper}>
        <input id={inputId} className={controlClasses} {...inputProps} />
        <div className={styles.focusHighlight}></div>
        {topRightControl ? (
          <div className="absolute right-2 top-2 z-30">{topRightControl}</div>
        ) : null}
      </div>
      {showCharCount ? (
        <p
          className={cn(
            "text-xs font-ui leading-none tracking-normal mt-0.5",
            characterCountClassName,
          )}
        >
          {characterCountLabel}
        </p>
      ) : null}
    </label>
  );
};
