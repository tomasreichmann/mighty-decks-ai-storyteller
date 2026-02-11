import type { ReactNode } from "react";
import { Section } from "./common/Section";
import { Text } from "./common/Text";

interface SessionSummaryCardProps {
  summary: string;
}

interface InlineToken {
  kind: "text" | "bold" | "italic" | "code";
  value: string;
}

interface ParsedHeadingBlock {
  kind: "heading";
  level: 1 | 2 | 3;
  text: string;
}

interface ParsedParagraphBlock {
  kind: "paragraph";
  text: string;
}

interface ParsedListBlock {
  kind: "ul" | "ol";
  items: string[];
}

type ParsedMarkdownBlock = ParsedHeadingBlock | ParsedParagraphBlock | ParsedListBlock;

const headingMatcher = /^(#{1,3})\s+(.+)$/;
const unorderedListMatcher = /^[-*]\s+(.+)$/;
const orderedListMatcher = /^\d+\.\s+(.+)$/;
const inlineMatcher = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;

const tokenizeInlineMarkdown = (value: string): InlineToken[] => {
  const tokens: InlineToken[] = [];
  let lastIndex = 0;

  for (const match of value.matchAll(inlineMatcher)) {
    const token = match[0];
    const tokenIndex = match.index ?? 0;

    if (tokenIndex > lastIndex) {
      tokens.push({
        kind: "text",
        value: value.slice(lastIndex, tokenIndex),
      });
    }

    if (token.startsWith("**") && token.endsWith("**")) {
      tokens.push({
        kind: "bold",
        value: token.slice(2, -2),
      });
    } else if (token.startsWith("*") && token.endsWith("*")) {
      tokens.push({
        kind: "italic",
        value: token.slice(1, -1),
      });
    } else if (token.startsWith("`") && token.endsWith("`")) {
      tokens.push({
        kind: "code",
        value: token.slice(1, -1),
      });
    } else {
      tokens.push({
        kind: "text",
        value: token,
      });
    }

    lastIndex = tokenIndex + token.length;
  }

  if (lastIndex < value.length) {
    tokens.push({
      kind: "text",
      value: value.slice(lastIndex),
    });
  }

  return tokens;
};

const renderInlineMarkdown = (value: string): ReactNode[] =>
  tokenizeInlineMarkdown(value).map((token, index) => {
    const key = `${token.kind}-${index}`;

    if (token.kind === "bold") {
      return <strong key={key}>{token.value}</strong>;
    }

    if (token.kind === "italic") {
      return <em key={key}>{token.value}</em>;
    }

    if (token.kind === "code") {
      return (
        <code key={key} className="rounded bg-kac-steel-light px-1 py-0.5 text-[0.92em] text-kac-iron">
          {token.value}
        </code>
      );
    }

    return <span key={key}>{token.value}</span>;
  });

const parseMarkdown = (value: string): ParsedMarkdownBlock[] => {
  const normalized = value.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const blocks: ParsedMarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index]?.trim() ?? "";
    if (!line) {
      index += 1;
      continue;
    }

    const headingMatch = line.match(headingMatcher);
    if (headingMatch) {
      const level = Math.min(3, headingMatch[1].length) as 1 | 2 | 3;
      blocks.push({
        kind: "heading",
        level,
        text: headingMatch[2].trim(),
      });
      index += 1;
      continue;
    }

    const unorderedMatch = line.match(unorderedListMatcher);
    if (unorderedMatch) {
      const items: string[] = [];
      let listCursor = index;
      while (listCursor < lines.length) {
        const currentLine = lines[listCursor]?.trim() ?? "";
        const match = currentLine.match(unorderedListMatcher);
        if (!match) {
          break;
        }

        items.push(match[1].trim());
        listCursor += 1;
      }

      blocks.push({
        kind: "ul",
        items,
      });
      index = listCursor;
      continue;
    }

    const orderedMatch = line.match(orderedListMatcher);
    if (orderedMatch) {
      const items: string[] = [];
      let listCursor = index;
      while (listCursor < lines.length) {
        const currentLine = lines[listCursor]?.trim() ?? "";
        const match = currentLine.match(orderedListMatcher);
        if (!match) {
          break;
        }

        items.push(match[1].trim());
        listCursor += 1;
      }

      blocks.push({
        kind: "ol",
        items,
      });
      index = listCursor;
      continue;
    }

    const paragraphLines: string[] = [];
    let paragraphCursor = index;
    while (paragraphCursor < lines.length) {
      const currentLine = lines[paragraphCursor]?.trim() ?? "";
      if (!currentLine) {
        break;
      }

      if (
        headingMatcher.test(currentLine) ||
        unorderedListMatcher.test(currentLine) ||
        orderedListMatcher.test(currentLine)
      ) {
        break;
      }

      paragraphLines.push(currentLine);
      paragraphCursor += 1;
    }

    blocks.push({
      kind: "paragraph",
      text: paragraphLines.join(" "),
    });
    index = paragraphCursor;
  }

  return blocks;
};

export const SessionSummaryCard = ({ summary }: SessionSummaryCardProps): JSX.Element => {
  const blocks = parseMarkdown(summary);

  return (
    <Section className="stack">
      <Text as="h2" variant="h2" color="iron" className="text-2xl">
        Session Summary
      </Text>
      <div className="grid gap-3 text-kac-iron-light">
        {blocks.length === 0 ? (
          <Text variant="body" color="iron-light">
            No summary available.
          </Text>
        ) : null}
        {blocks.map((block, index) => {
          if (block.kind === "heading") {
            if (block.level === 1) {
              return (
                <Text
                  key={`heading-${index}`}
                  as="h3"
                  variant="h3"
                  color="iron"
                  className="text-lg"
                >
                  {renderInlineMarkdown(block.text)}
                </Text>
              );
            }

            if (block.level === 2) {
              return (
                <Text
                  key={`heading-${index}`}
                  as="h4"
                  variant="h3"
                  color="iron"
                  className="text-base"
                >
                  {renderInlineMarkdown(block.text)}
                </Text>
              );
            }

            return (
              <Text
                key={`heading-${index}`}
                as="h5"
                variant="note"
                color="iron"
              >
                {renderInlineMarkdown(block.text)}
              </Text>
            );
          }

          if (block.kind === "ul") {
            return (
              <ul key={`ul-${index}`} className="list-disc space-y-1 pl-5">
                {block.items.map((item, itemIndex) => (
                  <li key={`ul-item-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
                ))}
              </ul>
            );
          }

          if (block.kind === "ol") {
            return (
              <ol key={`ol-${index}`} className="list-decimal space-y-1 pl-5">
                {block.items.map((item, itemIndex) => (
                  <li key={`ol-item-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
                ))}
              </ol>
            );
          }

          if (block.kind === "paragraph") {
            return (
              <Text key={`p-${index}`} variant="body" color="iron-light">
                {renderInlineMarkdown(block.text)}
              </Text>
            );
          }

          return null;
        })}
      </div>
    </Section>
  );
};

