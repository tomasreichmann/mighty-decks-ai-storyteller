export interface ParsedMarkdownImageToken {
  token: string;
  altText: string;
  src: string;
}

const MARKDOWN_IMAGE_PATTERN =
  /^!\[(?<altText>[^\]]*)\]\((?<src><[^>\n]+>|[^)\s]+)(?:\s+"[^"]*")?\)$/;

const normalizeWhitespace = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

export const normalizeMarkdownImageUrl = (
  value: string | null | undefined,
): string | null => {
  const trimmed = value?.trim() ?? "";
  if (trimmed.length === 0) {
    return null;
  }

  const unwrapped =
    trimmed.startsWith("<") && trimmed.endsWith(">")
      ? trimmed.slice(1, -1).trim()
      : trimmed;
  if (unwrapped.startsWith("/")) {
    return unwrapped;
  }
  if (unwrapped.startsWith("data:image/")) {
    return unwrapped;
  }

  try {
    const parsedUrl = new URL(unwrapped);
    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return parsedUrl.toString();
    }
  } catch {
    return null;
  }

  return null;
};

export const parseMarkdownImageToken = (
  token: string,
): ParsedMarkdownImageToken | null => {
  const trimmedToken = token.trim();
  const match = trimmedToken.match(MARKDOWN_IMAGE_PATTERN);
  if (!match?.groups) {
    return null;
  }

  const src = normalizeMarkdownImageUrl(match.groups.src);
  if (!src) {
    return null;
  }

  return {
    token: trimmedToken,
    altText: normalizeWhitespace(match.groups.altText ?? ""),
    src,
  };
};

export const buildMarkdownImageSnippet = (
  src: string,
  altText = "",
): string => {
  const normalizedSrc = src.trim();
  if (normalizedSrc.length === 0) {
    return "";
  }

  const normalizedAltText = normalizeWhitespace(altText).replaceAll("]", "\\]");
  return `![${normalizedAltText}](${normalizedSrc})`;
};

export const appendMarkdownSnippet = (
  value: string,
  snippet: string,
): string => {
  const normalizedSnippet = snippet.trim();
  if (normalizedSnippet.length === 0) {
    return value;
  }

  const trimmedValue = value.trimEnd();
  if (trimmedValue.length === 0) {
    return normalizedSnippet;
  }

  const separator = trimmedValue.endsWith("\n") ? "\n" : "\n\n";
  return `${trimmedValue}${separator}${normalizedSnippet}`;
};
