import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "./common/Button";
import { cn } from "../utils/cn";

interface ShareLinkOverlayProps {
  open: boolean;
  title: string;
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-kac-iron-dark/72 p-4"
      onClick={onClose}
      role="presentation"
    >
      <section
        className="w-full max-w-md rounded-xl border border-kac-steel-dark/40 bg-kac-steel-light/95 p-4 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold text-kac-iron">{title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close share overlay"
          >
            Close
          </Button>
        </div>

        <div className="mb-3 flex justify-center rounded-lg border border-kac-steel/70 bg-kac-steel-light/70 p-3">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`${title} QR code`}
              className="h-56 w-56 rounded-md border border-kac-steel/70 bg-white object-contain"
            />
          ) : (
            <div className="flex h-56 w-56 items-center justify-center text-sm text-kac-steel-dark">
              {qrError ?? "Generating QR code..."}
            </div>
          )}
        </div>

        <div className="rounded-md border border-kac-steel/70 bg-kac-steel-light/70 p-3">
          <p className="mb-1 text-xs uppercase tracking-wide text-kac-steel-dark/90">
            Link
          </p>
          <p className="break-all text-sm text-kac-iron-light">{url}</p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
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
          <p
            className={cn(
              "text-xs text-kac-steel-dark transition-opacity",
              copied ? "opacity-100" : "opacity-0",
            )}
          >
            Copied
          </p>
        </div>
      </section>
    </div>
  );
};
