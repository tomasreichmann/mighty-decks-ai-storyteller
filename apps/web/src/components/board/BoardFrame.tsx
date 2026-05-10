import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { cn } from "../../utils/cn";
import { useBoard } from "./BoardProvider";

interface BoardFrameProps {
  children: ReactNode;
  className?: string;
}

export const BoardFrame = ({
  children,
  className,
}: BoardFrameProps): JSX.Element => {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
  } | null>(null);
  const { viewport, panBy, zoomAt, setFrameSize } = useBoard();

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }

    const measure = (): void => {
      const rect = frame.getBoundingClientRect();
      setFrameSize({
        width: rect.width,
        height: rect.height,
      });
    };
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(frame);
    measure();

    return () => {
      resizeObserver.disconnect();
    };
  }, [setFrameSize]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }

    const handleWheel = (event: WheelEvent): void => {
      event.preventDefault();
      const rect = frame.getBoundingClientRect();
      const zoomMultiplier = event.deltaY < 0 ? 1.12 : 1 / 1.12;
      zoomAt(
        {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        },
        viewport.zoom * zoomMultiplier,
      );
    };

    frame.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      frame.removeEventListener("wheel", handleWheel);
    };
  }, [viewport.zoom, zoomAt]);

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ): void => {
    if (event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
    };
  };

  const handlePointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
  ): void => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - drag.clientX;
    const deltaY = event.clientY - drag.clientY;
    dragRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
    };
    panBy({
      x: -deltaX / viewport.zoom,
      y: -deltaY / viewport.zoom,
    });
  };

  const handlePointerUp = (
    event: ReactPointerEvent<HTMLDivElement>,
  ): void => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  return (
    <div
      ref={frameRef}
      className={cn(
        "board-frame relative min-h-0 flex-1 touch-none select-none overflow-hidden border-[3px] border-kac-iron bg-kac-cloth-dark shadow-[inset_0_0_0_2px_rgba(255,250,227,0.2),6px_6px_0_0_#121b23]",
        className,
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="application"
      aria-label="Interactive board frame"
    >
      {children}
    </div>
  );
};
