import { normalizeLegacyGameCardMarkdown } from "./gameCardMarkdown";

export interface NormalizedMarkdownEditorChange {
  value: string;
  normalized: boolean;
  exceedsMaxLength: boolean;
}

export const normalizeMarkdownEditorChange = (
  nextMarkdown: string,
  maxLength: number,
): NormalizedMarkdownEditorChange => {
  const value = normalizeLegacyGameCardMarkdown(nextMarkdown);
  return {
    value: value.length > maxLength ? nextMarkdown : value,
    normalized: value !== nextMarkdown,
    exceedsMaxLength: value.length > maxLength,
  };
};
