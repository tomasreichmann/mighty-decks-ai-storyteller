import { useEffect, useState } from "react";
import { cn } from "../../utils/cn";
import { Button } from "./Button";
import { Text } from "./Text";

interface CodeCopyRowProps {
  code: string;
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

const CopyIcon = (): JSX.Element => (
  <svg
    viewBox="0 0 24 24"
    className="h-3.5 w-3.5 fill-none stroke-current"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = (): JSX.Element => (
  <svg
    viewBox="0 0 24 24"
    className="h-3.5 w-3.5 fill-none stroke-current"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const CodeCopyRow = ({ code, className }: CodeCopyRowProps): JSX.Element => {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopied(false);
    }, 1400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [copied]);

  return (
    <div className={cn("mt-auto flex items-center justify-center gap-2", className)}>
      <Text
        variant="note"
        color={copied ? "monster" : "steel-dark"}
        className="text-[11px] normal-case opacity-90"
      >
        {code}
      </Text>
      <Button
        variant="ghost"
        color={copied ? "monster" : "cloth"}
        size="sm"
        className="h-7 w-7 p-0"
        onClick={() => {
          void copyToClipboard(code)
            .then(() => {
              setCopied(true);
              setCopyError(null);
            })
            .catch(() => {
              setCopyError(`Could not copy ${code}.`);
            });
        }}
        aria-label={`Copy ${code}`}
        title={`Copy ${code}`}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
      <span className="sr-only" aria-live="polite">
        {copied ? `Copied ${code}.` : copyError}
      </span>
    </div>
  );
};
