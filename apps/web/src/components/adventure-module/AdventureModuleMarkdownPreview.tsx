import {
  Children,
  cloneElement,
  isValidElement,
  type ReactNode,
} from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { type OutcomeSlug } from "../../types/types";
import {
  resolveMarkdownGameComponentToken,
  type ResolvedMarkdownGameComponent,
} from "../../lib/markdownGameComponents";
import { LayeredCard } from "../cards/LayeredCard";
import { Text } from "../common/Text";
import { cn } from "../../utils/cn";
import styles from "./AdventureModulePlayerInfoTabPanel.module.css";

interface AdventureModuleMarkdownPreviewProps {
  markdown: string;
  className?: string;
}

const titleClassByOutcomeSlug: Record<OutcomeSlug, string> = {
  "special-action": "text-special",
  success: "text-success",
  "partial-success": "text-partial",
  chaos: "text-chaos",
  fumble: "text-fumble",
};

const INLINE_TOKEN_PATTERN = /(^|\s)(@(outcome|effect|stunt)\/[A-Za-z0-9-]+)(?=\s|$)/g;

const MarkdownGameComponentCard = ({
  component,
}: {
  component: ResolvedMarkdownGameComponent;
}): JSX.Element => {
  switch (component.type) {
    case "outcome":
      return (
        <LayeredCard
          className="w-full max-w-[13rem]"
          imageUri={component.card.iconUri}
          noun={component.card.title}
          nounDeck={component.card.deck}
          nounCornerIcon="/types/outcome.png"
          nounEffect={component.card.description}
          adjectiveEffect={component.card.instructions}
          nounClassName={cn(
            "text-[19px]",
            titleClassByOutcomeSlug[component.card.slug],
          )}
          nounEffectClassName="text-[11px] text-kac-iron-light"
          adjectiveEffectClassName="text-[11px] font-semibold text-kac-iron"
        />
      );
    case "effect":
      return (
        <LayeredCard
          className="w-full max-w-[13rem]"
          imageUri={component.card.iconUri}
          noun={component.card.title}
          nounDeck={component.card.deck}
          nounCornerIcon="/types/effect.png"
          nounEffect={component.card.nounEffect}
          adjectiveEffect={component.card.adjectiveEffect}
          nounClassName="text-[18px] text-kac-iron"
          nounEffectClassName="text-[10px] text-kac-iron-light"
          adjectiveEffectClassName="text-[10px] font-semibold text-kac-iron"
        />
      );
    case "stunt":
      return (
        <LayeredCard
          className="w-full max-w-[13rem]"
          imageUri={component.card.iconUri}
          noun={component.card.title}
          nounDeck={component.card.deck}
          nounCornerIcon="/types/stunt.png"
          nounEffect={component.card.effect}
          adjectiveEffect={component.card.requirements}
          nounClassName="text-[17px] text-kac-iron"
          nounEffectClassName="text-[10px] text-kac-iron-light"
          adjectiveEffectClassName="text-[10px] font-semibold text-kac-blood-dark"
        />
      );
    default:
      return <></>;
  }
};

const tokenizeInlineMarkdownComponents = (
  value: string,
  keyPrefix: string,
): ReactNode[] => {
  const result: ReactNode[] = [];
  let cursor = 0;
  let matchIndex = 0;
  INLINE_TOKEN_PATTERN.lastIndex = 0;

  for (let match = INLINE_TOKEN_PATTERN.exec(value); match; match = INLINE_TOKEN_PATTERN.exec(value)) {
    const leadingWhitespace = match[1] ?? "";
    const token = match[2] ?? "";
    const tokenStart = match.index + leadingWhitespace.length;

    if (tokenStart > cursor) {
      result.push(value.slice(cursor, tokenStart));
    }

    const resolved = resolveMarkdownGameComponentToken(token);
    if (resolved) {
      result.push(
        <span
          key={`${keyPrefix}-component-${matchIndex}`}
          className="inline-block align-top mx-1 my-1"
        >
          <MarkdownGameComponentCard component={resolved} />
        </span>,
      );
    } else {
      result.push(token);
    }

    cursor = tokenStart + token.length;
    matchIndex += 1;
  }

  if (cursor < value.length) {
    result.push(value.slice(cursor));
  }

  return result.length > 0 ? result : [value];
};

const isHtmlTagElement = (
  node: ReactNode,
): node is React.ReactElement<{ children?: ReactNode }> =>
  isValidElement(node) && typeof node.type === "string";

const replaceInlineTokens = (
  node: ReactNode,
  keyPrefix: string,
): ReactNode => {
  if (typeof node === "string" || typeof node === "number") {
    return tokenizeInlineMarkdownComponents(String(node), keyPrefix);
  }

  if (Array.isArray(node)) {
    return node.map((child, index) =>
      replaceInlineTokens(child, `${keyPrefix}-${index}`),
    );
  }

  if (!isHtmlTagElement(node)) {
    return node;
  }

  const elementType = node.type;
  if (elementType === "code" || elementType === "pre") {
    return node;
  }

  const childArray = Children.toArray(node.props.children);
  if (childArray.length === 0) {
    return node;
  }

  const nextChildren = childArray.map((child, index) =>
    replaceInlineTokens(child, `${keyPrefix}-${index}`),
  );

  return cloneElement(node, undefined, ...nextChildren);
};

const previewComponents: Components = {
  p: ({ children }) => {
    return <p>{replaceInlineTokens(children, "p")}</p>;
  },
  ul: ({ children }) => <ul>{children}</ul>,
  ol: ({ children }) => <ol>{children}</ol>,
  li: ({ children }) => <li>{replaceInlineTokens(children, "li")}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-kac-iron-dark/30 pl-3 italic">
      {replaceInlineTokens(children, "blockquote")}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-kac-bone-light/60 px-1 py-0.5 font-mono text-[0.9em]">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded bg-kac-bone-light/60 p-2 font-mono text-xs">
      {children}
    </pre>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline decoration-kac-gold-dark/70 underline-offset-2"
    >
      {children}
    </a>
  ),
};

export const AdventureModuleMarkdownPreview = ({
  markdown,
  className,
}: AdventureModuleMarkdownPreviewProps): JSX.Element => {
  return (
    <div className={cn("stack gap-1", className)}>
      <Text variant="note" color="iron-light" className="text-xs !opacity-100">
        Preview
      </Text>
      <div className={styles.editorFrame}>
        <div className={styles.editorRoot}>
          <div className={styles.contentEditable}>
            {markdown.trim().length > 0 ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={previewComponents}>
                {markdown}
              </ReactMarkdown>
            ) : (
              <Text variant="note" color="iron-light" className="text-sm !opacity-100">
                Nothing to preview yet.
              </Text>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
