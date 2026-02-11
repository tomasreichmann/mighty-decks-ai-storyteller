import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "./common/Button";
import { cn } from "../utils/cn";
import { Text } from "./common/Text";
import { Panel } from "./common/Panel";
import { Label } from "./common/Label";

interface ShareLinkOverlayProps {
  open: boolean;
  title: string;
  shortTitle: string;
  url: string;
  onClose: () => void;
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
  document.execCommand("copy");
  textArea.remove();
};

export const ShareLinkOverlay = ({
  open,
  title,
  url,
  onClose,
}: ShareLinkOverlayProps): JSX.Element | null => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setQrDataUrl(null);
    setQrError(null);
    setCopied(false);
    let cancelled = false;

    void QRCode.toDataURL(url, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 320,
    })
      .then((dataUrl) => {
        if (cancelled) {
          return;
        }

        setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setQrError("Could not generate QR code.");
      });

    return () => {
      cancelled = true;
    };
  }, [open, url]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-kac-iron/70 bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.1)_0px,rgba(0,0,0,0.1)_10px,transparent_10px,transparent_20px)] p-4"
      onClick={onClose}
      role="presentation"
    >
      <Panel
        className="w-full max-w-md"
        contentClassName="stack gap-2"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mb-3 flex items-start justify-between gap-4 pt-4">
          <Label size="lg" className="absolute -top-2 -left-2">
            {title}
          </Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close share overlay"
            className="absolute -top-2 -right-2"
          >
            Close
          </Button>
        </div>

        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`${title} QR code`}
            className="block h-56 w-56 bg-white object-contain mx-auto"
          />
        ) : (
          <div className="flex h-56 w-56 items-center justify-center">
            <Text variant="body" color="steel-dark" className="text-sm">
              {qrError ?? "Generating QR code..."}
            </Text>
          </div>
        )}

        <div className="stack gap-2 items-center text-center">
          <a href={url} target="_blank" rel="noopener noreferrer" className="">
            <Text
              as="span"
              variant="body"
              color="gold-dark"
              className="break-all text-sm hover:underline"
            >
              {url}
            </Text>
          </a>
          <Button
            variant="secondary"
            onClick={() => {
              void copyToClipboard(url).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1400);
              });
            }}
          >
            Copy Address
          </Button>
          <Text
            className={cn(
              "text-xs transition-opacity",
              copied ? "opacity-100" : "opacity-0",
            )}
            variant="note"
            color="steel-dark"
          >
            Copied
          </Text>
        </div>
      </Panel>
    </div>
  );
};
