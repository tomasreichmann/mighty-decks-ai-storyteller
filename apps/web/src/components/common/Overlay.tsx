import { useEffect, type PropsWithChildren } from "react";
import { cn } from "../../utils/cn";
import { Panel, type PanelProps } from "./Panel";

interface OverlayProps extends PropsWithChildren {
  open: boolean;
  ariaLabel: string;
  onClose: () => void;
  tone?: PanelProps["tone"];
  panelClassName?: string;
  contentClassName?: string;
  backdropClassName?: string;
}

export const Overlay = ({
  open,
  ariaLabel,
  onClose,
  tone = "bone",
  panelClassName = "",
  contentClassName = "",
  backdropClassName = "",
  children,
}: OverlayProps): JSX.Element | null => {
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
      className={cn(
        "fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-kac-iron/70 bg-[radial-gradient(circle_at_top,rgba(255,210,59,0.18),transparent_45%),repeating-linear-gradient(45deg,rgba(0,0,0,0.12)_0px,rgba(0,0,0,0.12)_12px,transparent_12px,transparent_24px)] p-4 sm:items-center",
        backdropClassName,
      )}
      onClick={onClose}
      role="presentation"
    >
      <Panel
        as="div"
        className={cn("w-full", panelClassName)}
        contentClassName={cn("stack gap-4", contentClassName)}
        tone={tone}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        {children}
      </Panel>
    </div>
  );
};
