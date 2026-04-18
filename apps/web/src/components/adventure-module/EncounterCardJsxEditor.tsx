import { useEffect, useMemo, useState, type MouseEvent } from "react";
import {
  lexical,
  useNestedEditorContext,
  type JsxEditorProps,
} from "@mdxeditor/editor";
import { useAuthoringContext } from "../../lib/authoring/store/AuthoringProvider";
import { resolveEncounterCard } from "../../lib/markdownEncounterComponents";
import { useGameCardCatalogContext } from "../../lib/gameCardCatalogContext";
import { SceneCardDetailLink } from "./SceneCardDetailLink";
import styles from "./AdventureModulePlayerInfoTabPanel.module.css";
import { EncounterCardView, InvalidEncounterCardView } from "./EncounterCardView";

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

export const EncounterCardJsxEditor = ({
  mdastNode,
}: JsxEditorProps): JSX.Element => {
  const { buildRoute, state } = useAuthoringContext();
  const { lexicalNode, parentEditor } = useNestedEditorContext();
  const { encountersBySlug } = useGameCardCatalogContext();
  const nodeKey = lexicalNode.getKey();
  const nodeType = lexicalNode.getType();
  const [isSelected, setIsSelected] = useState(false);

  const slug = getStringAttribute(mdastNode, "slug");

  const resolvedEncounterCard = useMemo(() => {
    if (!slug) {
      return null;
    }
    return resolveEncounterCard(slug, encountersBySlug);
  }, [encountersBySlug, slug]);

  const detailHref = useMemo(() => {
    const moduleSlug = state.detail?.index.slug;
    if (!moduleSlug || !slug) {
      return null;
    }
    return buildRoute(moduleSlug, "encounters", slug);
  }, [buildRoute, slug, state.detail?.index.slug]);

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

  const handleClick = (event: MouseEvent<HTMLButtonElement>): void => {
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
    <span className="relative z-0 inline-block align-top pb-4">
      <button
        type="button"
        className={`${styles.gameCardShell} ${isSelected ? styles.gameCardShellSelected : ""} block appearance-none border-0 bg-transparent p-0 text-left cursor-pointer`}
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onClick={handleClick}
        data-selected={isSelected ? "true" : "false"}
        contentEditable={false}
      >
        {resolvedEncounterCard ? (
          <EncounterCardView encounter={resolvedEncounterCard.encounter} />
        ) : (
          <InvalidEncounterCardView slug={slug} />
        )}
      </button>
      <SceneCardDetailLink
        href={detailHref}
        label={`Open ${resolvedEncounterCard?.encounter.title ?? "encounter"} detail in a new tab`}
      />
    </span>
  );
};
