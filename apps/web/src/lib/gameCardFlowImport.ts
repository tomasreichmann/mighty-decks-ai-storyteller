export interface MarkdownPoint {
  line?: number;
  offset?: number;
}

export interface MarkdownPosition {
  start?: MarkdownPoint;
  end?: MarkdownPoint;
}

export interface GameCardFlowImportNode {
  type?: string;
  name?: string | null;
  position?: MarkdownPosition;
}

export interface InlineGameCardFlowPlacement {
  joinPreviousParagraph: boolean;
  separatorText: string;
}

const isGameCardFlowNode = (
  value: unknown,
): value is Required<Pick<GameCardFlowImportNode, "type" | "name">> &
  GameCardFlowImportNode =>
  Boolean(
    value &&
      typeof value === "object" &&
      "type" in value &&
      "name" in value &&
      (value as GameCardFlowImportNode).type === "mdxJsxFlowElement" &&
      (value as GameCardFlowImportNode).name === "GameCard",
  );

const resolveSeparatorText = (
  previousNode: GameCardFlowImportNode,
  currentNode: GameCardFlowImportNode,
): string => {
  const previousOffset = previousNode.position?.end?.offset;
  const currentOffset = currentNode.position?.start?.offset;
  if (
    typeof previousOffset === "number" &&
    typeof currentOffset === "number" &&
    currentOffset > previousOffset
  ) {
    return " ".repeat(currentOffset - previousOffset);
  }
  return " ";
};

export const getInlineGameCardFlowPlacement = (
  siblings: readonly unknown[],
  currentIndex: number,
): InlineGameCardFlowPlacement => {
  const currentNode = siblings[currentIndex];
  const previousNode = currentIndex > 0 ? siblings[currentIndex - 1] : null;

  if (!isGameCardFlowNode(currentNode) || !isGameCardFlowNode(previousNode)) {
    return {
      joinPreviousParagraph: false,
      separatorText: "",
    };
  }

  const currentLine = currentNode.position?.start?.line;
  const previousLine = previousNode.position?.end?.line;
  if (
    typeof currentLine !== "number" ||
    typeof previousLine !== "number" ||
    currentLine !== previousLine
  ) {
    return {
      joinPreviousParagraph: false,
      separatorText: "",
    };
  }

  return {
    joinPreviousParagraph: true,
    separatorText: resolveSeparatorText(previousNode, currentNode),
  };
};
