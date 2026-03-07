import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "../../utils/cn";

export type DropdownDirection = "top" | "bottom" | "left" | "right";
export type DropdownAlign = "start" | "center" | "end";

export type DropdownTriggerRenderProps = {
  onClick: () => void;
  "aria-haspopup": "menu";
  "aria-expanded": boolean;
  "aria-controls": string;
};

export type DropdownRenderContext = {
  close: () => void;
  open: boolean;
};

export interface DropdownProps {
  direction?: DropdownDirection;
  align?: DropdownAlign;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  menuClassName?: string;
  renderTrigger: (props: DropdownTriggerRenderProps) => ReactNode;
  children: ReactNode | ((ctx: DropdownRenderContext) => ReactNode);
}

const resolvePositionClasses = (
  direction: DropdownDirection,
  align: DropdownAlign,
): string => {
  if (direction === "top" || direction === "bottom") {
    const axisClass =
      direction === "bottom" ? "top-full mt-1" : "bottom-full mb-1";
    const alignClass =
      align === "start"
        ? "left-0"
        : align === "center"
          ? "left-1/2 -translate-x-1/2"
          : "right-0";
    return `${axisClass} ${alignClass}`;
  }

  const axisClass = direction === "right" ? "left-full ml-1" : "right-full mr-1";
  const alignClass =
    align === "start"
      ? "top-0"
      : align === "center"
        ? "top-1/2 -translate-y-1/2"
        : "bottom-0";
  return `${axisClass} ${alignClass}`;
};

export const Dropdown = ({
  direction = "bottom",
  align = "start",
  open,
  defaultOpen = false,
  onOpenChange,
  closeOnOutsideClick = true,
  closeOnEscape = true,
  className = "",
  menuClassName = "",
  renderTrigger,
  children,
}: DropdownProps): JSX.Element => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const resolvedOpen = isControlled ? open : uncontrolledOpen;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  const setOpen = useCallback(
    (nextOpen: boolean): void => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  const close = useCallback((): void => {
    setOpen(false);
  }, [setOpen]);

  const toggle = useCallback((): void => {
    setOpen(!resolvedOpen);
  }, [resolvedOpen, setOpen]);

  useEffect(() => {
    if (!resolvedOpen || !closeOnOutsideClick) {
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
      close();
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [close, closeOnOutsideClick, resolvedOpen]);

  useEffect(() => {
    if (!resolvedOpen || !closeOnEscape) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") {
        return;
      }
      close();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, closeOnEscape, resolvedOpen]);

  const positionClasses = useMemo(
    () => resolvePositionClasses(direction, align),
    [align, direction],
  );

  const renderedChildren =
    typeof children === "function"
      ? (children as (ctx: DropdownRenderContext) => ReactNode)({
          close,
          open: resolvedOpen,
        })
      : children;

  return (
    <div ref={rootRef} className={cn("relative inline-block", className)}>
      {renderTrigger({
        onClick: toggle,
        "aria-haspopup": "menu",
        "aria-expanded": resolvedOpen,
        "aria-controls": menuId,
      })}

      {resolvedOpen ? (
        <div id={menuId} className={cn("absolute z-40", positionClasses, menuClassName)}>
          {renderedChildren}
        </div>
      ) : null}
    </div>
  );
};
