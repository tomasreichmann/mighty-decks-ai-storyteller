import { useEffect, useState } from "react";
import {
  SMART_CONTEXT_TAG_OPTIONS,
  getDefaultSmartContextTags,
  normalizeSmartContextTags,
  resolveSmartContextLines,
  type SmartInputDocumentContext,
} from "../lib/smartInputContext";
import { buildMarkdownImageSnippet } from "../lib/markdownImage";
import { AdventureModuleGeneratedImageField } from "./adventure-module/AdventureModuleGeneratedImageField";
import { Button, type ButtonProps } from "./common/Button";
import { Label } from "./common/Label";
import { Panel } from "./common/Panel";
import { Text } from "./common/Text";
import { TextField } from "./common/TextField";

export interface MarkdownImageInsertButtonProps {
  identityKey: string;
  smartContextDocument?: SmartInputDocumentContext;
  currentInputValue?: string;
  initialImageUrl?: string;
  disabled?: boolean;
  dialogTitle?: string;
  dialogDescription?: string;
  promptLabel?: string;
  promptDescription: string;
  workflowContextIntro: string;
  imageLabel?: string;
  contextLabel?: string;
  contextDescription?: string;
  generateLabel?: string;
  insertButtonLabel?: string;
  buttonAriaLabel?: string;
  buttonTitle?: string;
  buttonColor?: ButtonProps["color"];
  buttonSize?: ButtonProps["size"];
  buttonClassName?: string;
  contextTagOptions?: readonly string[];
  defaultContextTags?: readonly string[];
  resolveContextLines?: (selectedContextTags: string[]) => string[];
  hideAltTextField?: boolean;
  onInsertImageUrl?: (imageUrl: string) => boolean | void;
  onInsertMarkdownSnippet?: (snippet: string) => boolean | void;
}

const normalizeInsertResult = (result: boolean | void): boolean =>
  result !== false;

export const MarkdownImageInsertButton = ({
  identityKey,
  smartContextDocument,
  currentInputValue,
  initialImageUrl,
  disabled = false,
  dialogTitle = "Insert Image Markdown",
  dialogDescription = "Generate or reuse an image, then insert it as standard markdown syntax.",
  promptLabel = "Image Prompt",
  promptDescription,
  workflowContextIntro,
  imageLabel = "Generated Image",
  contextLabel = "Image Context",
  contextDescription = "Selected context tags are appended to the prompt used for generation and lookup, while the inserted markdown stays standard `![alt](url)` syntax.",
  generateLabel,
  insertButtonLabel,
  buttonAriaLabel = "Open image tools",
  buttonTitle = "Insert image",
  buttonColor = "bone",
  buttonSize = "sm",
  buttonClassName = "",
  contextTagOptions = SMART_CONTEXT_TAG_OPTIONS,
  defaultContextTags = getDefaultSmartContextTags(),
  resolveContextLines,
  hideAltTextField = false,
  onInsertImageUrl,
  onInsertMarkdownSnippet,
}: MarkdownImageInsertButtonProps): JSX.Element => {
  const normalizedInitialImageUrl = initialImageUrl?.trim() ?? "";
  const [open, setOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(
    normalizedInitialImageUrl,
  );
  const [altText, setAltText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const resolvedInsertButtonLabel =
    insertButtonLabel ??
    (onInsertImageUrl ? "Use Image" : "Insert Image Markdown");
  const resolvedContextLines =
    resolveContextLines ??
    ((selectedContextTags: string[]) =>
      smartContextDocument
        ? resolveSmartContextLines({
            selectedTags: normalizeSmartContextTags(
              selectedContextTags,
              [...SMART_CONTEXT_TAG_OPTIONS],
            ),
            context: smartContextDocument,
            currentInputValue: currentInputValue ?? "",
          })
        : []);

  useEffect(() => {
    setOpen(false);
    setSelectedImageUrl(normalizedInitialImageUrl);
    setAltText("");
    setErrorMessage(null);
  }, [identityKey, normalizedInitialImageUrl]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setOpen(false);
        setErrorMessage(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const closeModal = (): void => {
    setOpen(false);
    setErrorMessage(null);
  };

  return (
    <>
      <Button
        variant="circle"
        color={buttonColor}
        size={buttonSize}
        className={`text-base leading-none ${buttonClassName}`.trim()}
        aria-label={buttonAriaLabel}
        title={buttonTitle}
        disabled={disabled}
        onClick={() => {
          if (normalizedInitialImageUrl.length > 0) {
            setSelectedImageUrl(normalizedInitialImageUrl);
          }
          setOpen(true);
          setErrorMessage(null);
        }}
      >
        <span aria-hidden="true">🖼️</span>
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-kac-iron/70 bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.1)_0px,rgba(0,0,0,0.1)_10px,transparent_10px,transparent_20px)] p-4 sm:items-center"
          onClick={closeModal}
          role="presentation"
        >
          <Panel
            className="my-auto w-full max-w-4xl max-h-[calc(100vh-2rem)]"
            contentClassName="flex max-h-[calc(100vh-5rem)] min-h-0 flex-col gap-0"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={dialogTitle}
          >
            <div className="relative shrink-0 px-4 pb-3 pt-5">
              <Label size="lg" className="absolute left-4 top-0 -translate-y-1/2">
                {dialogTitle}
              </Label>
              <div className="absolute right-4 top-0 -translate-y-1/2">
                <Button
                  variant="solid"
                  color="bone"
                  size="sm"
                  onClick={closeModal}
                  aria-label="Close image tools"
                >
                  Close
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 pt-3">
              <div className="stack gap-4">
                <Text variant="body" color="iron-light" className="text-sm">
                  {dialogDescription}
                </Text>

                <AdventureModuleGeneratedImageField
                  label={imageLabel}
                  promptLabel={promptLabel}
                  promptDescription={promptDescription}
                  contextLabel={contextLabel}
                  contextDescription={contextDescription}
                  workflowContextIntro={workflowContextIntro}
                  value={selectedImageUrl}
                  disabled={disabled}
                  identityKey={identityKey}
                  contextTagOptions={contextTagOptions}
                  defaultContextTags={defaultContextTags}
                  resolveContextLines={resolvedContextLines}
                  emptyLabel="No image selected yet."
                  pendingLabel="Generating image..."
                  generateLabel={generateLabel}
                  valueFieldLabel="Selected Image URL"
                  valueFieldDescription="Paste an existing image URL or pick one from the generated batch below."
                  onChange={(nextValue) => {
                    setSelectedImageUrl(nextValue);
                    setErrorMessage(null);
                  }}
                />

                {hideAltTextField ? null : (
                  <TextField
                    label="Alt Text"
                    description="Optional text stored in the markdown image tag."
                    value={altText}
                    onChange={(event) => {
                      setAltText(event.target.value);
                      setErrorMessage(null);
                    }}
                    disabled={disabled}
                    maxLength={160}
                    placeholder="Describe the image for readers."
                  />
                )}
              </div>
            </div>

            <div className="shrink-0 border-t-2 border-kac-iron/15 px-4 pb-4 pt-3">
              {errorMessage ? (
                <Text variant="note" color="blood" className="text-sm !opacity-100">
                  {errorMessage}
                </Text>
              ) : null}

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button variant="ghost" color="cloth" onClick={closeModal}>
                  Cancel
                </Button>
                <Button
                  color="gold"
                  disabled={disabled || selectedImageUrl.trim().length === 0}
                  onClick={() => {
                    const normalizedImageUrl = selectedImageUrl.trim();
                    if (normalizedImageUrl.length === 0) {
                      setErrorMessage(
                        "Select an image before inserting markdown.",
                      );
                      return;
                    }

                    if (onInsertImageUrl) {
                      if (
                        !normalizeInsertResult(
                          onInsertImageUrl(normalizedImageUrl),
                        )
                      ) {
                        setErrorMessage(
                          "Could not select the image for this field.",
                        );
                        return;
                      }
                    } else if (onInsertMarkdownSnippet) {
                      const snippet = buildMarkdownImageSnippet(
                        normalizedImageUrl,
                        altText,
                      );
                      if (snippet.length === 0) {
                        setErrorMessage(
                          "Select an image before inserting markdown.",
                        );
                        return;
                      }
                      if (
                        !normalizeInsertResult(onInsertMarkdownSnippet(snippet))
                      ) {
                        setErrorMessage(
                          "Could not insert the image into this field.",
                        );
                        return;
                      }
                    } else {
                      setErrorMessage(
                        "No image insertion handler was configured.",
                      );
                      return;
                    }
                    closeModal();
                  }}
                >
                  {resolvedInsertButtonLabel}
                </Button>
              </div>
            </div>
          </Panel>
        </div>
      ) : null}
    </>
  );
};
