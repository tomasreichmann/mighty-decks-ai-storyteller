import { useCallback, useEffect, useState } from "react";
import { Button } from "../common/Button";
import { Message } from "../common/Message";
import { Text } from "../common/Text";

interface ShortcodeFieldProps {
  shortcode: string;
  className?: string;
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

  return (
    <div className={`stack gap-2 ${className}`.trim()}>
      <div className="inline-flex max-w-full items-center justify-center gap-1.5 self-center">
        <Text
          variant="note"
          color="iron"
          className="text-sm font-semibold !opacity-100"
        >
          <code>{shortcode}</code>
        </Text>
        <Button
          variant="circle"
          color={copied ? "monster" : "cloth"}
          size="sm"
          aria-label={copied ? "Copied shortcode" : "Copy shortcode"}
          title={copied ? "Copied shortcode" : "Copy shortcode"}
          onClick={() => {
            void handleCopy();
          }}
        >
          <span aria-hidden="true">{copied ? "✓" : "📋"}</span>
        </Button>
      </div>

      {copyError ? (
        <Message label="Copy failed" color="blood">
          {copyError}
        </Message>
      ) : null}
    </div>
  );
};
