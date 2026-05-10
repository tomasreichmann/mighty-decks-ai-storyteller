import { useCallback, type CSSProperties, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import { useBoard } from "./BoardProvider";
import type { BoardItemRecord } from "../../lib/board/boardController";

interface BoardProps {
  className?: string;
  renderItem?: (item: BoardItemRecord) => ReactNode;
}

const itemToneClass = {
  note: "bg-kac-bone-light text-kac-iron rotate-[-1deg]",
  card: "bg-kac-gold-light text-kac-iron rotate-[1deg]",
  image: "bg-kac-steel-light text-kac-iron rotate-[-0.4deg]",
};

const DefaultBoardItemContent = ({
  item,
}: {
  item: BoardItemRecord;
}): JSX.Element => {
  return (
    <>
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
    </>
  );
};

const BoardItem = ({
  item,
  registerItemElement,
  transitionDurationMs,
  renderItem,
}: {
  item: BoardItemRecord;
  registerItemElement: (id: string, element: HTMLElement | null) => void;
  transitionDurationMs: number;
  renderItem?: (item: BoardItemRecord) => ReactNode;
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
    transform: `rotate(${item.rotation ?? 0}deg)`,
    transitionProperty: "left, top, transform",
    transitionDuration: `${transitionDurationMs}ms`,
    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
  };
  const hasCustomRenderer = Boolean(renderItem);

  return (
    <article
      ref={itemRef}
      className={cn(
        "board-item absolute",
        hasCustomRenderer
          ? "overflow-visible"
          : "flex flex-col gap-2 rounded-sm border-[3px] border-kac-iron p-4 shadow-[4px_4px_0_0_#121b23]",
        hasCustomRenderer ? null : itemToneClass[item.kind],
      )}
      style={style}
    >
      {renderItem ? renderItem(item) : <DefaultBoardItemContent item={item} />}
    </article>
  );
};

export const Board = ({ className, renderItem }: BoardProps): JSX.Element => {
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
        "board absolute left-0 top-0 overflow-visible bg-transparent",
        className,
      )}
      style={boardStyle}
    >
      {items.map((item) => (
        <BoardItem
          key={item.id}
          item={item}
          registerItemElement={registerItemElement}
          transitionDurationMs={transitionDurationMs}
          renderItem={renderItem}
        />
      ))}
    </div>
  );
};
