export type GameCardType =
  | "OutcomeCard"
  | "EffectCard"
  | "StuntCard"
  | "ActorCard";

export type LegacyGameCardTokenType = "outcome" | "effect" | "stunt" | "actor";

const INLINE_TOKEN_PATTERN =
  /(^|\s)(@(outcome|effect|stunt|actor)\/[A-Za-z0-9-]+)(?=\s|$)/g;
const FENCE_PATTERN = /^([`~]{3,})(.*)$/;
const INLINE_CODE_SPLIT_PATTERN = /(`+[^`]*`+)/g;
const INDENTED_CODE_LINE_PATTERN = /^(?: {4}|\t)/;

const legacyTypeToGameCardType: Record<LegacyGameCardTokenType, GameCardType> = {
  outcome: "OutcomeCard",
  effect: "EffectCard",
  stunt: "StuntCard",
  actor: "ActorCard",
};

export const createGameCardJsx = (
  type: GameCardType,
  slug: string,
): string => `<GameCard type="${type}" slug="${slug}" />`;

export const parseLegacyGameCardToken = (
  token: string,
):
  | {
      legacyType: LegacyGameCardTokenType;
      type: GameCardType;
      slug: string;
      token: string;
    }
  | null => {
  const match = /^@(outcome|effect|stunt|actor)\/([A-Za-z0-9-]+)$/.exec(
    token.trim(),
  );
  if (!match) {
    return null;
  }

  const legacyType = match[1] as LegacyGameCardTokenType;
  const slug = match[2];

  return {
    legacyType,
    type: legacyTypeToGameCardType[legacyType],
    slug,
    token: token.trim(),
  };
};

const replaceLegacyTokensOutsideInlineCode = (value: string): string => {
  const segments = value.split(INLINE_CODE_SPLIT_PATTERN);
  return segments
    .map((segment, index) => {
      if (index % 2 === 1) {
        return segment;
      }

      INLINE_TOKEN_PATTERN.lastIndex = 0;
      return segment.replace(
        INLINE_TOKEN_PATTERN,
        (_match, leadingWhitespace: string, token: string) => {
          const parsed = parseLegacyGameCardToken(token);
          if (!parsed) {
            return `${leadingWhitespace}${token}`;
          }
          return `${leadingWhitespace}${createGameCardJsx(parsed.type, parsed.slug)}`;
        },
      );
    })
    .join("");
};

export const normalizeLegacyGameCardMarkdown = (markdown: string): string => {
  const lines = markdown.split("\n");
  const normalizedLines: string[] = [];
  let activeFence: string | null = null;
  let activeIndentedCodeBlock = false;
  let previousLineBlank = true;

  for (const line of lines) {
    const isBlank = line.trim().length === 0;
    const isIndentedCodeLine = INDENTED_CODE_LINE_PATTERN.test(line);
    const fenceMatch = FENCE_PATTERN.exec(line);

    if (activeFence !== null) {
      normalizedLines.push(line);
      const closingFence = fenceMatch?.[1] ?? "";
      if (closingFence.length > 0 && activeFence === (closingFence[0] ?? null)) {
        activeFence = null;
      }
      previousLineBlank = isBlank;
      continue;
    }

    if (activeIndentedCodeBlock) {
      if (isIndentedCodeLine || isBlank) {
        normalizedLines.push(line);
        previousLineBlank = isBlank;
        continue;
      }
      activeIndentedCodeBlock = false;
    }

    if (isIndentedCodeLine && previousLineBlank) {
      activeIndentedCodeBlock = true;
      normalizedLines.push(line);
      previousLineBlank = isBlank;
      continue;
    }

    if (fenceMatch) {
      const fence = fenceMatch[1] ?? "";
      if (activeFence === null) {
        activeFence = fence[0] ?? null;
      } else if (activeFence === (fence[0] ?? null)) {
        activeFence = null;
      }
      normalizedLines.push(line);
      previousLineBlank = isBlank;
      continue;
    }

    normalizedLines.push(replaceLegacyTokensOutsideInlineCode(line));
    previousLineBlank = isBlank;
  }

  return normalizedLines.join("\n");
};
