import { useEffect, useMemo, useState, type MouseEvent } from "react";
import {
  lexical,
  useNestedEditorContext,
  type JsxEditorProps,
} from "@mdxeditor/editor";
import {
  resolveGameCard,
  type GameCardType,
} from "../../lib/markdownGameComponents";
import { useGameCardCatalogContext } from "../../lib/gameCardCatalogContext";
import styles from "./AdventureModulePlayerInfoTabPanel.module.css";
import { GameCardView, InvalidGameCardView } from "./GameCardView";

const isGameCardType = (value: string): value is GameCardType =>
  value === "OutcomeCard" ||
  value === "EffectCard" ||
  value === "StuntCard" ||
  value === "ActorCard" ||
  value === "CounterCard" ||
  value === "AssetCard";

const getStringAttribute = (
  mdastNode: JsxEditorProps["mdastNode"],
  attributeName: string,
): string | undefined => {
  const attribute = mdastNode.attributes.find(
    (entry) =>
      entry.type === "mdxJsxAttribute" &&
      entry.name === attributeName &&
      typeof entry.value === "string",
  );
  return typeof attribute?.value === "string" ? attribute.value : undefined;
};

const hasNodeSelection = (
  selection: ReturnType<typeof lexical.$getSelection>,
  nodeKey: string,
): boolean => lexical.$isNodeSelection(selection) && selection.has(nodeKey);

export const GameCardJsxEditor = ({
  mdastNode,
}: JsxEditorProps): JSX.Element => {
  const { lexicalNode, parentEditor } = useNestedEditorContext();
  const { actorsBySlug, countersBySlug, assetsBySlug } = useGameCardCatalogContext();
  const nodeKey = lexicalNode.getKey();
  const nodeType = lexicalNode.getType();
  const [isSelected, setIsSelected] = useState(false);

  const type = getStringAttribute(mdastNode, "type");
  const slug = getStringAttribute(mdastNode, "slug");

  const resolvedGameCard = useMemo(() => {
    if (!type || !slug || !isGameCardType(type)) {
      return null;
    }
    return resolveGameCard(type, slug, actorsBySlug, countersBySlug, assetsBySlug);
  }, [actorsBySlug, assetsBySlug, countersBySlug, slug, type]);

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
        <InvalidGameCardView type={type} slug={slug} />
      )}
    </span>
  );
};
