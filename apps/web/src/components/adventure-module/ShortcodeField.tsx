import { useCallback, useEffect, useState } from "react";
import {
  Button,
  type ButtonColors,
  type ButtonVariant,
} from "../common/Button";
import { Message } from "../common/Message";
import { Text } from "../common/Text";

interface ShortcodeFieldProps {
  shortcode: string;
  className?: string;
  onAddToSelection?: () => void;
  addButtonLabel?: string;
  showShortcode?: boolean;
  copyLabel?: string;
  copiedLabel?: string;
  copyButtonText?: string | null;
  copiedButtonText?: string | null;
  copyButtonVariant?: ButtonVariant;
  copyButtonColor?: ButtonColors;
}

const copyToClipboard = async (value: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "true");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.append(textArea);
  textArea.select();
  const copied = document.execCommand("copy");
  textArea.remove();
  if (!copied) {
    throw new Error("Clipboard copy failed.");
  }
};

export const ShortcodeField = ({
  shortcode,
  className = "",
  onAddToSelection,
  addButtonLabel = "Add to table selection",
  showShortcode = true,
  copyLabel = "Copy shortcode",
  copiedLabel = "Copied shortcode",
  copyButtonText = null,
  copiedButtonText = null,
  copyButtonVariant = "circle",
  copyButtonColor = "cloth",
}: ShortcodeFieldProps): JSX.Element => {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopied(false);
    }, 2000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [copied]);

  const handleCopy = useCallback(async (): Promise<void> => {
    try {
      await copyToClipboard(shortcode);
      setCopied(true);
      setCopyError(null);
    } catch {
      setCopyError(`Could not copy ${shortcode}.`);
    }
  }, [shortcode]);

  const copyButtonLabel = copied ? copiedLabel : copyLabel;
  const copyButtonTone = copied ? "monster" : copyButtonColor;
  const copyButtonSize = copyButtonVariant === "circle" ? "sm" : "md";
  const compactRowClassName =
    "inline-flex max-w-full flex-wrap items-center justify-center gap-1.5 self-center";
  const buttonOnlyRowClassName =
    "inline-flex max-w-full flex-wrap items-center justify-start gap-2";
  const copyButtonChildren =
    copyButtonText === null ? (
      <span aria-hidden="true">{copied ? "OK" : "📋"}</span>
    ) : (
      <span>{copied ? (copiedButtonText ?? copyButtonText) : copyButtonText}</span>
    );

  return (
    <div className={`stack gap-2 min-w-0 ${className}`.trim()}>
      <div className={showShortcode ? compactRowClassName : buttonOnlyRowClassName}>
        {showShortcode ? (
          <Text
            variant="note"
            color="iron"
            className="min-w-0 break-all text-center text-sm font-semibold !opacity-100"
          >
            <code>{shortcode}</code>
          </Text>
        ) : null}
        <Button
          variant={copyButtonVariant}
          color={copyButtonTone}
          size={copyButtonSize}
          aria-label={copyButtonLabel}
          title={copyButtonLabel}
          onClick={() => {
            void handleCopy();
          }}
        >
          {copyButtonChildren}
        </Button>
        {onAddToSelection ? (
          <Button
            variant="circle"
            color="gold"
            size="sm"
            aria-label={addButtonLabel}
            title={addButtonLabel}
            onClick={onAddToSelection}
          >
            <span aria-hidden="true">+</span>
          </Button>
        ) : null}
      </div>

      {copyError ? (
        <Message label="Copy failed" color="blood">
          {copyError}
        </Message>
      ) : null}
    </div>
  );
};
