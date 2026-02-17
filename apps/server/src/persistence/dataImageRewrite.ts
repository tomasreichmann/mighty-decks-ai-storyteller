import type { AdventureArtifactStore } from "./AdventureArtifactStore";

const DATA_IMAGE_URI_PATTERN = /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g;

export interface DataImageRewriteResult {
  rewrittenText: string;
  replacements: Array<{
    fileName: string;
    fileUrl: string;
  }>;
}

export const hasInlineDataImage = (value: string): boolean =>
  /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/.test(value);

export const redactInlineDataImages = (value: string): string =>
  value.replace(DATA_IMAGE_URI_PATTERN, "[omitted inline image payload]");

export const rewriteDataImageUrisInText = async (
  value: string,
  artifactStore: AdventureArtifactStore,
  options: { hint?: string } = {},
): Promise<DataImageRewriteResult> => {
  const matches = value.match(DATA_IMAGE_URI_PATTERN);
  if (!matches || matches.length === 0) {
    return {
      rewrittenText: value,
      replacements: [],
    };
  }

  let rewrittenText = value;
  const replacements: DataImageRewriteResult["replacements"] = [];

  for (const match of matches) {
    const persisted = await artifactStore.persistDataImageUri(match, {
      hint: options.hint,
    });
    const token = `${persisted.fileName} (${persisted.fileUrl})`;
    rewrittenText = rewrittenText.replace(match, token);
    replacements.push({
      fileName: persisted.fileName,
      fileUrl: persisted.fileUrl,
    });
  }

  return {
    rewrittenText,
    replacements,
  };
};
