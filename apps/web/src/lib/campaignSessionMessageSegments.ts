import {
  parseLegacyGameCardToken,
  type GameCardType,
} from "./gameCardMarkdown";

const SHORTCODE_PATTERN =
  /@(?:asset\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)?|(?:outcome|effect|stunt|actor|counter|encounter|quest)\/[A-Za-z0-9_-]+)/g;

export type CampaignSessionMessageSegment =
  | { kind: "text"; text: string }
  | {
      kind: "game_card";
      token: string;
      type: GameCardType;
      slug: string;
      modifierSlug?: string;
    }
  | { kind: "encounter_card"; token: string; slug: string }
  | { kind: "quest_card"; token: string; slug: string };

const toShortcodeSegment = (
  token: string,
): CampaignSessionMessageSegment | null => {
  if (token.startsWith("@encounter/")) {
    return {
      kind: "encounter_card",
      token,
      slug: token.slice("@encounter/".length),
    };
  }

  if (token.startsWith("@quest/")) {
    return {
      kind: "quest_card",
      token,
      slug: token.slice("@quest/".length),
    };
  }

  const parsed = parseLegacyGameCardToken(token);
  if (!parsed) {
    return null;
  }

  return {
    kind: "game_card",
    token,
    type: parsed.type,
    slug: parsed.slug,
    ...(parsed.modifierSlug
      ? { modifierSlug: parsed.modifierSlug }
      : {}),
  };
};

export const parseCampaignSessionMessageSegments = (
  value: string,
): CampaignSessionMessageSegment[] => {
  const segments: CampaignSessionMessageSegment[] = [];
  let cursor = 0;

  for (const match of value.matchAll(SHORTCODE_PATTERN)) {
    const token = match[0];
    const index = match.index ?? 0;

    if (index > cursor) {
      segments.push({
        kind: "text",
        text: value.slice(cursor, index),
      });
    }

    const shortcodeSegment = toShortcodeSegment(token);
    if (shortcodeSegment) {
      segments.push(shortcodeSegment);
    } else {
      segments.push({
        kind: "text",
        text: token,
      });
    }

    cursor = index + token.length;
  }

  if (cursor < value.length) {
    segments.push({
      kind: "text",
      text: value.slice(cursor),
    });
  }

  return segments.filter(
    (segment) => segment.kind !== "text" || segment.text.length > 0,
  );
};
