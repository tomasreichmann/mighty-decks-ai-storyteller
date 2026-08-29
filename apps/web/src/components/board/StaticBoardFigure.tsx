import type { ReactNode } from "react";
import type {
  BoardItemInput,
  BoardItemRecord,
  BoardSize,
} from "../../lib/board/boardController";
import { Board } from "./Board";
import { BoardFrame } from "./BoardFrame";
import { BoardProvider } from "./BoardProvider";

interface StaticBoardFigureProps {
  boardSize: BoardSize;
  items: BoardItemInput[];
  ariaLabel: string;
  className?: string;
  backgroundImageUrl?: string;
  renderItem?: (item: BoardItemRecord) => ReactNode;
}

export const StaticBoardFigure = ({
  boardSize,
  items,
  ariaLabel,
  className,
  backgroundImageUrl,
  renderItem,
}: StaticBoardFigureProps): JSX.Element => (
  <BoardProvider boardSize={boardSize} initialItems={items}>
    <BoardFrame interactive={false} ariaLabel={ariaLabel} className={className} backgroundImageUrl={backgroundImageUrl}>
      <Board renderItem={renderItem} />
    </BoardFrame>
  </BoardProvider>
);
