import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { lexical } from "@mdxeditor/editor";

import { GameCardView, InvalidGameCardView } from "../components/adventure-module/GameCardView";
import styles from "../components/adventure-module/AdventureModulePlayerInfoTabPanel.module.css";
import { useGameCardCatalogContext } from "./gameCardCatalogContext";
import {
  resolveGameCard,
  type GameCardType,
} from "./markdownGameComponents";

const isGameCardType = (value: string | null): value is GameCardType =>
  value === "OutcomeCard" ||
  value === "EffectCard" ||
  value === "StuntCard" ||
  value === "ActorCard" ||
  value === "CounterCard" ||
  value === "AssetCard";

const hasNodeSelection = (
  selection: ReturnType<typeof lexical.$getSelection>,
  nodeKey: string,
): boolean => lexical.$isNodeSelection(selection) && selection.has(nodeKey);

interface ParentEditorLike {
  focus(): void;
  getEditorState(): {
    read(fn: () => void): void;
  };
  registerCommand(
    command: unknown,
    listener: (event: KeyboardEvent) => boolean,
    priority: number,
  ): () => void;
  registerUpdateListener(listener: (payload: {
    editorState: {
      read(fn: () => void): void;
    };
  }) => void): () => void;
  update(fn: () => void): void;
}

interface InlineGameCardDecoratorProps {
  lexicalNode: InlineGameCardNode;
  parentEditor: ParentEditorLike;
}

const InlineGameCardDecorator = ({
  lexicalNode,
  parentEditor,
}: InlineGameCardDecoratorProps): JSX.Element => {
  const { actorsBySlug, countersBySlug, assetsBySlug } = useGameCardCatalogContext();
  const nodeKey = lexicalNode.getKey();
  const nodeType = lexicalNode.getType();
  const [isSelected, setIsSelected] = useState(false);
  const cardType = lexicalNode.getCardType();
  const slug = lexicalNode.getSlug();
  const modifierSlug = lexicalNode.getModifierSlug();

  const resolvedGameCard = useMemo(() => {
    if (!isGameCardType(cardType) || !slug) {
      return null;
    }
    return resolveGameCard(
      cardType,
      slug,
      actorsBySlug,
      countersBySlug,
      assetsBySlug,
      modifierSlug ?? undefined,
    );
  }, [actorsBySlug, assetsBySlug, cardType, countersBySlug, modifierSlug, slug]);

  useEffect(() => {
    const syncSelectedState = (): void => {
      parentEditor.getEditorState().read(() => {
        setIsSelected(hasNodeSelection(lexical.$getSelection(), nodeKey));
      });
    };

    syncSelectedState();

    const unregisterUpdate = parentEditor.registerUpdateListener(
      ({ editorState }) => {
        editorState.read(() => {
          setIsSelected(hasNodeSelection(lexical.$getSelection(), nodeKey));
        });
      },
    );

    const handleDelete = (event: KeyboardEvent): boolean => {
      const selection = lexical.$getSelection();
      if (!hasNodeSelection(selection, nodeKey)) {
        return false;
      }

      event.preventDefault();
      if (!selection) {
        return false;
      }
      for (const selectedNode of selection.getNodes()) {
        if (selectedNode.getType() !== nodeType) {
          continue;
        }
        selectedNode.remove();
      }
      return true;
    };

    const unregisterDelete = parentEditor.registerCommand(
      lexical.KEY_DELETE_COMMAND,
      handleDelete,
      lexical.COMMAND_PRIORITY_LOW,
    );
    const unregisterBackspace = parentEditor.registerCommand(
      lexical.KEY_BACKSPACE_COMMAND,
      handleDelete,
      lexical.COMMAND_PRIORITY_LOW,
    );

    return () => {
      unregisterUpdate();
      unregisterDelete();
      unregisterBackspace();
    };
  }, [nodeKey, nodeType, parentEditor]);

  const handleClick = (event: MouseEvent<HTMLSpanElement>): void => {
    event.preventDefault();
    event.stopPropagation();

    parentEditor.update(() => {
      const currentSelection = lexical.$getSelection();
      const nextSelection = lexical.$createNodeSelection();

      if (event.shiftKey && lexical.$isNodeSelection(currentSelection)) {
        for (const node of currentSelection.getNodes()) {
          nextSelection.add(node.getKey());
        }
        if (nextSelection.has(nodeKey)) {
          nextSelection.delete(nodeKey);
        } else {
          nextSelection.add(nodeKey);
        }
      } else {
        nextSelection.add(nodeKey);
      }

      lexical.$setSelection(nextSelection);
    });
    parentEditor.focus();
  };

  return (
    <span
      className={`${styles.gameCardShell} ${isSelected ? styles.gameCardShellSelected : ""}`}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      onClick={handleClick}
      data-selected={isSelected ? "true" : "false"}
    >
      {resolvedGameCard ? (
        <GameCardView gameCard={resolvedGameCard} />
      ) : (
        <InvalidGameCardView type={cardType ?? undefined} slug={slug ?? undefined} />
      )}
    </span>
  );
};

interface SerializedInlineGameCardNode {
  type: "inline-game-card";
  version: 2;
  cardType: string | null;
  slug: string | null;
  modifierSlug?: string | null;
}

export class InlineGameCardNode extends lexical.DecoratorNode<JSX.Element> {
  __cardType: string | null;
  __slug: string | null;
  __modifierSlug: string | null;

  static override getType(): string {
    return "inline-game-card";
  }

  static override clone(node: InlineGameCardNode): InlineGameCardNode {
    return new InlineGameCardNode(
      node.__cardType,
      node.__slug,
      node.__modifierSlug,
      node.__key,
    );
  }

  static override importJSON(
    serializedNode: SerializedInlineGameCardNode,
  ): InlineGameCardNode {
    return $createInlineGameCardNode(
      serializedNode.cardType,
      serializedNode.slug,
      serializedNode.modifierSlug ?? null,
    );
  }

  constructor(
    cardType: string | null,
    slug: string | null,
    modifierSlug: string | null,
    key?: string,
  ) {
    super(key);
    this.__cardType = cardType;
    this.__slug = slug;
    this.__modifierSlug = modifierSlug;
  }

  override exportJSON(): SerializedInlineGameCardNode {
    return {
      type: "inline-game-card",
      version: 2,
      cardType: this.getCardType(),
      slug: this.getSlug(),
      modifierSlug: this.getModifierSlug(),
    };
  }

  override createDOM(): HTMLElement {
    return document.createElement("span");
  }

  override updateDOM(): false {
    return false;
  }

  override isInline(): true {
    return true;
  }

  override isKeyboardSelectable(): true {
    return true;
  }

  getCardType(): string | null {
    return this.__cardType;
  }

  getSlug(): string | null {
    return this.__slug;
  }

  getModifierSlug(): string | null {
    return this.__modifierSlug;
  }

  override decorate(parentEditor: ParentEditorLike): JSX.Element {
    return (
      <InlineGameCardDecorator
        lexicalNode={this}
        parentEditor={parentEditor}
      />
    );
  }
}

export const $createInlineGameCardNode = (
  cardType: string | null,
  slug: string | null,
  modifierSlug: string | null = null,
): InlineGameCardNode => new InlineGameCardNode(cardType, slug, modifierSlug);

export const $isInlineGameCardNode = (
  value: unknown,
): value is InlineGameCardNode => value instanceof InlineGameCardNode;
