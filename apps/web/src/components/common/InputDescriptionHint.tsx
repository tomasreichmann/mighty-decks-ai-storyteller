import { useEffect, useId, useRef, useState } from "react";
import { cn } from "../../utils/cn";

interface InputDescriptionHintProps {
  description: string;
  className?: string;
  placement?: "right" | "bottom";
  tooltipClassName?: string;
}

export const InputDescriptionHint = ({
  description,
  className = "",
  placement = "right",
  tooltipClassName = "z-50",
}: InputDescriptionHintProps): JSX.Element => {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const tooltipId = useId();
  const isOpen = pinned || hovered || focused;

  useEffect(() => {
    if (!pinned) {
      return;
    }

    const handlePointerDown = (event: PointerEvent): void => {
      const targetNode = event.target as Node | null;
      if (!targetNode) {
        return;
      }
      if (rootRef.current?.contains(targetNode)) {
        return;
      }
      setPinned(false);
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setPinned(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [pinned]);

  return (
    <span
      ref={rootRef}
      className={cn("relative inline-flex items-center", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        aria-label="Show field description"
        aria-expanded={isOpen}
        aria-controls={tooltipId}
        className={cn(
          "inline-flex h-5 w-5 items-center justify-center rounded-full border border-kac-iron",
          "bg-gradient-to-b from-kac-steel-light to-kac-bone-light text-[10px] font-ui font-bold text-kac-iron",
          "shadow-[1px_1px_0_0_#121b23] transition duration-100 hover:brightness-[1.03]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/50",
        )}
        onMouseDown={(event) => {
          event.preventDefault();
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setPinned((current) => !current);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        i
      </button>

      {isOpen ? (
        <div
          id={tooltipId}
          role="tooltip"
          className={cn(
            "absolute w-72 max-w-[calc(100vw-2rem)] rounded-sm border-2 border-kac-iron-dark",
            placement === "bottom"
              ? "left-0 top-full mt-2"
              : "left-full top-1/2 ml-2 -translate-y-1/2",
            "bg-[linear-gradient(179deg,var(--tw-gradient-stops))] from-kac-steel-light to-[#f7f9fc]",
            "px-3 py-2 text-xs font-ui leading-snug text-kac-iron shadow-[3px_3px_0_0_#121b23]",
            tooltipClassName,
          )}
        >
          {description}
        </div>
      ) : null}
    </span>
  );
};
