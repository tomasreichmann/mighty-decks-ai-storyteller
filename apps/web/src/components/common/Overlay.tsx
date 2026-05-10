import { useEffect, type MouseEvent, type PropsWithChildren } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";
import { Panel, type PanelProps } from "./Panel";

interface OverlayProps extends PropsWithChildren {
  open: boolean;
  ariaLabel: string;
  onClose: () => void;
  tone?: PanelProps["tone"];
  surface?: "panel" | "plain";
  panelClassName?: string;
  contentClassName?: string;
  backdropClassName?: string;
}

export const Overlay = ({
  open,
  ariaLabel,
  onClose,
  tone = "bone",
  surface = "panel",
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

  const dialogProps = {
    onClick: (event: MouseEvent<HTMLDivElement>): void => {
      event.stopPropagation();
    },
    role: "dialog" as const,
    "aria-modal": "true" as const,
    "aria-label": ariaLabel,
  };

  const overlay = (
    <div
      className={cn(
        backdropClassName,
        "fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto bg-kac-iron/70 bg-[radial-gradient(circle_at_top,rgba(255,210,59,0.18),transparent_45%),repeating-linear-gradient(45deg,rgba(0,0,0,0.12)_0px,rgba(0,0,0,0.12)_12px,transparent_12px,transparent_24px)] p-4 sm:items-center",
      )}
      onClick={onClose}
      role="presentation"
    >
      {surface === "plain" ? (
        <div
          className={cn("w-full", panelClassName, contentClassName)}
          {...dialogProps}
        >
          {children}
        </div>
      ) : (
        <Panel
          as="div"
          className={cn("w-full", panelClassName)}
          contentClassName={cn("stack gap-4", contentClassName)}
          tone={tone}
          {...dialogProps}
        >
          {children}
        </Panel>
      )}
    </div>
  );

  return typeof document === "undefined"
    ? overlay
    : createPortal(overlay, document.body);
};
