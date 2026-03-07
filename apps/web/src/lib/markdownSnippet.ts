const collapseWhitespace = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

const stripMarkdownToText = (markdown: string): string => {
  const withoutFencedCode = markdown.replace(/```[\s\S]*?```/g, " ");
  const withoutInlineCode = withoutFencedCode.replace(/`([^`]+)`/g, "$1");
  const withoutImages = withoutInlineCode.replace(/!\[([^\]]*)]\(([^)]+)\)/g, "$1");
  const withoutLinks = withoutImages.replace(/\[([^\]]+)]\(([^)]+)\)/g, "$1");
  const withoutHtml = withoutLinks.replace(/<[^>]+>/g, " ");
  const withoutHeadings = withoutHtml.replace(/^\s{0,3}#{1,6}\s+/gm, "");
  const withoutQuotes = withoutHeadings.replace(/^\s{0,3}>\s?/gm, "");
  const withoutListMarkers = withoutQuotes
    .replace(/^\s{0,3}[-*+]\s+/gm, "")
    .replace(/^\s{0,3}\d+\.\s+/gm, "");
  const withoutRules = withoutListMarkers.replace(/^\s{0,3}([-*_]\s?){3,}$/gm, " ");
  const withoutFormatting = withoutRules.replace(/[*_~]/g, "");
  const normalizedLineBreaks = withoutFormatting.replace(/\r?\n+/g, " ");
  return collapseWhitespace(normalizedLineBreaks);
};

export const toMarkdownPlainTextSnippet = (
  markdown: string,
  maxLength: number,
): string => {
  if (maxLength <= 0) {
    return "";
  }

  const plainText = stripMarkdownToText(markdown);
  if (plainText.length <= maxLength) {
    return plainText;
  }
  return plainText.slice(0, maxLength).trimEnd();
};

