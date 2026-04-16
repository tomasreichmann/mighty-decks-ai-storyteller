import { useMemo } from "react";
import { resolveServerUrl } from "../../lib/socket";
import { cn } from "../../utils/cn";
import { MarkdownImageInsertButton } from "../MarkdownImageInsertButton";
import type { ButtonProps } from "../common/Button";

const toImageSrc = (imageUrl: string): string => {
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("data:")
  ) {
    return imageUrl;
  }

  return new URL(imageUrl, resolveServerUrl()).toString();
};

export interface AdventureModuleGeneratedImagePickerProps {
  label: string;
  promptLabel: string;
  promptDescription: string;
  contextLabel: string;
  contextDescription: string;
  workflowContextIntro: string;
  value?: string;
  disabled?: boolean;
  contextTagOptions?: readonly string[];
  defaultContextTags?: readonly string[];
  emptyLabel?: string;
  emptyFrameClassName?: string;
  identityKey: string;
  resolveContextLines: (selectedContextTags: string[]) => string[];
  onChange: (nextValue: string) => void;
  onBlur?: () => void;
  generateLabel?: string;
  dialogTitle?: string;
  dialogDescription?: string;
  buttonAriaLabel?: string;
  buttonTitle?: string;
  buttonColor?: ButtonProps["color"];
  buttonSize?: ButtonProps["size"];
  buttonClassName?: string;
}

export const AdventureModuleGeneratedImagePicker = ({
  label,
  promptLabel,
  promptDescription,
  contextLabel,
  contextDescription,
  workflowContextIntro,
  value = "",
  disabled = false,
  contextTagOptions,
  defaultContextTags,
  emptyLabel = "No image selected yet.",
  emptyFrameClassName = "aspect-video min-h-56",
  identityKey,
  resolveContextLines,
  onChange,
  onBlur,
  generateLabel,
  dialogTitle = label,
  dialogDescription = "Generate a new image or reuse an existing one, then choose it for this field.",
  buttonAriaLabel = `Open ${label.toLocaleLowerCase()} picker`,
  buttonTitle = `Choose ${label.toLocaleLowerCase()}`,
  buttonColor = "bone",
  buttonSize = "sm",
  buttonClassName = "",
}: AdventureModuleGeneratedImagePickerProps): JSX.Element => {
  const normalizedValue = value.trim();
  const imageSrc = useMemo(
    () => (normalizedValue.length > 0 ? toImageSrc(normalizedValue) : ""),
    [normalizedValue],
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden border-2 border-kac-iron bg-kac-iron-dark",
        emptyFrameClassName,
      )}
    >
      {normalizedValue.length > 0 ? (
        <img
          src={imageSrc}
          alt={`${label} preview`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center px-4">
          <span className="sr-only">{emptyLabel}</span>
        </div>
      )}

      <MarkdownImageInsertButton
        identityKey={identityKey}
        disabled={disabled}
        initialImageUrl={normalizedValue}
        dialogTitle={dialogTitle}
        dialogDescription={dialogDescription}
        promptLabel={promptLabel}
        promptDescription={promptDescription}
        workflowContextIntro={workflowContextIntro}
        imageLabel={label}
        contextLabel={contextLabel}
        contextDescription={contextDescription}
        generateLabel={generateLabel}
        insertButtonLabel="Use Image"
        buttonAriaLabel={buttonAriaLabel}
        buttonTitle={buttonTitle}
        buttonColor={buttonColor}
        buttonSize={buttonSize}
        buttonClassName={cn("absolute right-2 top-2 z-10", buttonClassName)}
        contextTagOptions={contextTagOptions}
        defaultContextTags={defaultContextTags}
        resolveContextLines={resolveContextLines}
        hideAltTextField
        onInsertImageUrl={(nextImageUrl) => {
          onChange(nextImageUrl);
          onBlur?.();
        }}
      />

      <div className="sr-only">
        <span>{contextLabel}</span>
        <span>{contextDescription}</span>
      </div>
    </div>
  );
};
