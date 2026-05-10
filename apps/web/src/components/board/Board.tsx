import { useCallback, type CSSProperties } from "react";
import { cn } from "../../utils/cn";
import { useBoard } from "./BoardProvider";
import type { BoardItemRecord } from "../../lib/board/boardController";

interface BoardProps {
  className?: string;
}

const itemToneClass = {
  note: "bg-kac-bone-light text-kac-iron rotate-[-1deg]",
  card: "bg-kac-gold-light text-kac-iron rotate-[1deg]",
  image: "bg-kac-steel-light text-kac-iron rotate-[-0.4deg]",
};

const BoardItem = ({
  item,
  registerItemElement,
  transitionDurationMs,
}: {
  item: BoardItemRecord;
  registerItemElement: (id: string, element: HTMLElement | null) => void;
  transitionDurationMs: number;
}): JSX.Element => {
  const itemRef = useCallback(
    (element: HTMLElement | null): void => {
      registerItemElement(item.id, element);
    },
    [item.id, registerItemElement],
  );
  const style: CSSProperties = {
    left: item.x,
    top: item.y,
    width: item.width,
    minHeight: item.height,
    zIndex: item.zIndex,
    transitionProperty: "left, top",
    transitionDuration: `${transitionDurationMs}ms`,
    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
  };

  return (
    <article
      ref={itemRef}
      className={cn(
        "board-item absolute flex flex-col gap-2 rounded-sm border-[3px] border-kac-iron p-4 shadow-[4px_4px_0_0_#121b23]",
        itemToneClass[item.kind],
      )}
      style={style}
    >
      {item.kind === "image" && item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.title ?? "Board image"}
          className="max-h-40 w-full border-2 border-kac-iron object-cover"
          draggable={false}
        />
      ) : null}
      {item.title ? (
        <h2 className="font-heading text-2xl leading-none text-kac-iron">
          {item.title}
        </h2>
      ) : null}
      {item.body ? (
        <p className="font-ui text-sm font-semibold leading-snug text-kac-iron">
          {item.body}
        </p>
      ) : null}
      <span className="mt-auto font-ui text-[0.65rem] font-bold uppercase tracking-[0.08em] text-kac-iron/60">
        {Math.round(item.x)}, {Math.round(item.y)}
      </span>
    </article>
  );
};

export const Board = ({ className }: BoardProps): JSX.Element => {
  const {
    boardSize,
    viewport,
    transitionDurationMs,
    items,
    registerItemElement,
  } = useBoard();
  const boardStyle: CSSProperties = {
    width: boardSize.width,
    height: boardSize.height,
    transform: `translate(${-viewport.x * viewport.zoom}px, ${-viewport.y * viewport.zoom}px) scale(${viewport.zoom})`,
    transformOrigin: "0 0",
    transitionProperty: "transform",
    transitionDuration: `${transitionDurationMs}ms`,
    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
  };

  return (
    <div
      className={cn(
        "board absolute left-0 top-0 overflow-hidden bg-kac-bone",
        "bg-[linear-gradient(90deg,rgba(18,27,35,0.12)_1px,transparent_1px),linear-gradient(180deg,rgba(18,27,35,0.12)_1px,transparent_1px),radial-gradient(circle_at_22%_18%,rgba(255,249,227,0.32),transparent_28%),radial-gradient(circle_at_80%_72%,rgba(194,75,43,0.12),transparent_24%)] bg-[length:120px_120px,120px_120px,auto,auto]",
        className,
      )}
      style={boardStyle}
    >
      <div className="pointer-events-none absolute inset-6 border-2 border-dashed border-kac-iron/35" />
      {items.map((item) => (
        <BoardItem
          key={item.id}
          item={item}
          registerItemElement={registerItemElement}
          transitionDurationMs={transitionDurationMs}
        />
      ))}
    </div>
  );
};
