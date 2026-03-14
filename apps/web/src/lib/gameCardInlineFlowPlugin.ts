import {
  addExportVisitor$,
  addImportVisitor$,
  addLexicalNode$,
  lexical,
  realmPlugin,
  type LexicalVisitor,
  type MdastImportVisitor,
} from "@mdxeditor/editor";

import {
  getInlineGameCardFlowPlacement,
  type GameCardFlowImportNode,
} from "./gameCardFlowImport";
import {
  $createInlineGameCardNode,
  $isInlineGameCardNode,
  InlineGameCardNode,
} from "./InlineGameCardNode";

interface GameCardAttribute {
  type: string;
  name: string;
  value?: unknown;
}

interface GameCardFlowMdastNode extends GameCardFlowImportNode {
  type: "mdxJsxFlowElement";
  name: "GameCard";
  attributes: GameCardAttribute[];
  children: unknown[];
}

interface LexicalElementParentLike {
  append(node: unknown): void;
  getLastChild(): LexicalChildLike | null;
}

interface LexicalChildLike {
  getType(): string;
  append(...nodes: unknown[]): void;
}

const isGameCardFlowMdastNode = (value: unknown): value is GameCardFlowMdastNode =>
  Boolean(
    value &&
      typeof value === "object" &&
      "type" in value &&
      "name" in value &&
      (value as GameCardFlowImportNode).type === "mdxJsxFlowElement" &&
      (value as GameCardFlowImportNode).name === "GameCard",
  );

const getStringAttribute = (
  attributes: readonly GameCardAttribute[],
  attributeName: string,
): string | null => {
  const attribute = attributes.find(
    (entry) => entry.type === "mdxJsxAttribute" && entry.name === attributeName,
  );
  return typeof attribute?.value === "string" ? attribute.value : null;
};

const gameCardFlowImportVisitor: MdastImportVisitor<any> = {
  priority: -150,
  testNode: (mdastNode, descriptors) => {
    if (!isGameCardFlowMdastNode(mdastNode)) {
      return false;
    }

    const descriptor =
      descriptors.jsxComponentDescriptors.find(
        (candidate) => candidate.name === mdastNode.name,
      ) ??
      descriptors.jsxComponentDescriptors.find(
        (candidate) => candidate.name === "*",
      );
    return descriptor?.kind === "text";
  },
  visitNode({ mdastNode, mdastParent, lexicalParent }) {
    const lexicalElementParent = lexicalParent as unknown as LexicalElementParentLike;
    const siblings = Array.isArray(mdastParent?.children)
      ? mdastParent.children
      : [mdastNode];
    const currentIndex = siblings.indexOf(mdastNode);
    const placement =
      currentIndex >= 0
        ? getInlineGameCardFlowPlacement(siblings, currentIndex)
        : {
            joinPreviousParagraph: false,
            separatorText: "",
          };

    let paragraph = placement.joinPreviousParagraph
      ? lexicalElementParent.getLastChild()
      : null;
    if (!paragraph || paragraph.getType() !== "paragraph") {
      paragraph = lexical.$createParagraphNode();
      lexicalElementParent.append(paragraph);
    }

    if (placement.separatorText.length > 0) {
      paragraph.append(lexical.$createTextNode(placement.separatorText));
    }

    paragraph.append(
      $createInlineGameCardNode(
        getStringAttribute(mdastNode.attributes, "type"),
        getStringAttribute(mdastNode.attributes, "slug"),
      ),
    );
  },
};

const inlineGameCardExportVisitor: LexicalVisitor = {
  testLexicalNode: $isInlineGameCardNode,
  visitLexicalNode({ lexicalNode, mdastParent, actions }) {
    const inlineGameCardNode = lexicalNode as InlineGameCardNode;
    actions.registerReferredComponent("GameCard");
    actions.appendToParent(mdastParent, {
      type: "mdxJsxTextElement",
      name: "GameCard",
      attributes: [
        {
          type: "mdxJsxAttribute",
          name: "type",
          value: inlineGameCardNode.getCardType() ?? "",
        },
        {
          type: "mdxJsxAttribute",
          name: "slug",
          value: inlineGameCardNode.getSlug() ?? "",
        },
      ],
      children: [],
    });
  },
};

export const gameCardInlineFlowPlugin = realmPlugin({
  init(realm) {
    realm.pubIn({
      [addImportVisitor$]: gameCardFlowImportVisitor,
      [addLexicalNode$]: InlineGameCardNode,
      [addExportVisitor$]: inlineGameCardExportVisitor,
    });
  },
});
