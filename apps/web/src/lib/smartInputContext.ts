import { toMarkdownPlainTextSnippet } from "./markdownSnippet";

export const SMART_CONTEXT_TAG_OPTIONS = [
  "Module Title",
  "Module Summary",
  "Module Intent",
  "Premise",
  "Have Tags",
  "Avoid Tags",
  "Player Summary",
  "Player Info",
  "Storyteller Summary",
  "Storyteller Info",
  "Current Input Content",
] as const;

export type SmartInputContextTag = (typeof SMART_CONTEXT_TAG_OPTIONS)[number];

export interface SmartInputDocumentContext {
  moduleTitle: string;
  moduleSummary: string;
  moduleIntent: string;
  premise: string;
  haveTags: string[];
  avoidTags: string[];
  playerSummary: string;
  playerInfo: string;
  storytellerSummary: string;
  storytellerInfo: string;
}

const DEFAULT_SMART_CONTEXT_TAGS: SmartInputContextTag[] = [
  "Module Title",
  "Premise",
  "Have Tags",
  "Avoid Tags",
];

const SMART_CONTEXT_TAG_SET = new Set<string>(SMART_CONTEXT_TAG_OPTIONS);
const MAX_CONTEXT_DESCRIPTION_LENGTH = 1000;

const normalizeWhitespace = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

const truncate = (value: string, maxLength: number): string => {
  if (maxLength <= 0) {
    return "";
  }
  if (value.length <= maxLength) {
    return value;
  }
  if (maxLength <= 3) {
    return value.slice(0, maxLength);
  }
  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
};

const toSnippet = (value: string, maxLength: number): string =>
  truncate(toMarkdownPlainTextSnippet(value, maxLength).trim(), maxLength);

const toTagSnippet = (values: string[], maxLength: number): string => {
  const normalized = values
    .map((value) => normalizeWhitespace(value))
    .filter((value) => value.length > 0);
  if (normalized.length === 0) {
    return "";
  }
  return truncate(normalized.join(", "), maxLength);
};

const dedupeTags = (values: string[]): SmartInputContextTag[] => {
  const result: SmartInputContextTag[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const normalized = normalizeWhitespace(value);
    if (!SMART_CONTEXT_TAG_SET.has(normalized)) {
      continue;
    }
    const key = normalized.toLocaleLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(normalized as SmartInputContextTag);
  }

  return result;
};

export const getSmartContextTagOptions = (
  excludedTags: SmartInputContextTag[] = [],
): SmartInputContextTag[] => {
  const excluded = new Set(excludedTags);
  return SMART_CONTEXT_TAG_OPTIONS.filter((tag) => !excluded.has(tag));
};

export const normalizeSmartContextTags = (
  tags: string[],
  allowedTags: SmartInputContextTag[],
): SmartInputContextTag[] => {
  const allowedSet = new Set(allowedTags);
  return dedupeTags(tags).filter((tag) => allowedSet.has(tag));
};

export const getDefaultSmartContextTags = (
  excludedTags: SmartInputContextTag[] = [],
): SmartInputContextTag[] => {
  const excluded = new Set(excludedTags);
  return DEFAULT_SMART_CONTEXT_TAGS.filter((tag) => !excluded.has(tag));
};

interface ResolveContextLinesArgs {
  selectedTags: SmartInputContextTag[];
  context: SmartInputDocumentContext;
  currentInputValue: string;
}

export const resolveSmartContextLines = ({
  selectedTags,
  context,
  currentInputValue,
}: ResolveContextLinesArgs): string[] => {
  const lines: string[] = [];

  for (const tag of selectedTags) {
    switch (tag) {
      case "Module Title": {
        const snippet = toSnippet(context.moduleTitle, 120);
        if (snippet.length > 0) {
          lines.push(`Module title: ${snippet}`);
        }
        break;
      }
      case "Module Summary": {
        const snippet = toSnippet(context.moduleSummary, 220);
        if (snippet.length > 0) {
          lines.push(`Module summary: ${snippet}`);
        }
        break;
      }
      case "Module Intent": {
        const snippet = toSnippet(context.moduleIntent, 220);
        if (snippet.length > 0) {
          lines.push(`Module intent: ${snippet}`);
        }
        break;
      }
      case "Premise": {
        const snippet = toSnippet(context.premise, 220);
        if (snippet.length > 0) {
          lines.push(`Premise: ${snippet}`);
        }
        break;
      }
      case "Have Tags": {
        const snippet = toTagSnippet(context.haveTags, 180);
        if (snippet.length > 0) {
          lines.push(`Have tags: ${snippet}`);
        }
        break;
      }
      case "Avoid Tags": {
        const snippet = toTagSnippet(context.avoidTags, 180);
        if (snippet.length > 0) {
          lines.push(`Avoid tags: ${snippet}`);
        }
        break;
      }
      case "Player Summary": {
        const snippet = toSnippet(context.playerSummary, 220);
        if (snippet.length > 0) {
          lines.push(`Player summary: ${snippet}`);
        }
        break;
      }
      case "Player Info": {
        const snippet = toSnippet(context.playerInfo, 220);
        if (snippet.length > 0) {
          lines.push(`Player info: ${snippet}`);
        }
        break;
      }
      case "Storyteller Summary": {
        const snippet = toSnippet(context.storytellerSummary, 220);
        if (snippet.length > 0) {
          lines.push(`Storyteller summary: ${snippet}`);
        }
        break;
      }
      case "Storyteller Info": {
        const snippet = toSnippet(context.storytellerInfo, 220);
        if (snippet.length > 0) {
          lines.push(`Storyteller info: ${snippet}`);
        }
        break;
      }
      case "Current Input Content": {
        const snippet = toSnippet(currentInputValue, 220);
        if (snippet.length > 0) {
          lines.push(`Current input content: ${snippet}`);
        }
        break;
      }
      default:
        break;
    }
  }

  return lines;
};

interface BuildSmartInputContextDescriptionArgs {
  inputLabel: string;
  inputDescription?: string;
  selectedTags: SmartInputContextTag[];
  context: SmartInputDocumentContext;
  currentInputValue: string;
}

export const buildSmartInputContextDescription = ({
  inputLabel,
  inputDescription,
  selectedTags,
  context,
  currentInputValue,
}: BuildSmartInputContextDescriptionArgs): string => {
  const lines: string[] = [];
  const label = normalizeWhitespace(inputLabel);
  const description = normalizeWhitespace(inputDescription ?? "");

  if (label.length > 0) {
    lines.push(`Smart input label: ${truncate(label, 120)}`);
  }
  if (description.length > 0) {
    lines.push(`Smart input description: ${truncate(description, 260)}`);
  }

  const contextLines = resolveSmartContextLines({
    selectedTags,
    context,
    currentInputValue,
  });

  if (contextLines.length > 0) {
    lines.push("Selected document context:");
    for (const contextLine of contextLines) {
      lines.push(`- ${contextLine}`);
    }
  }

  return truncate(lines.join("\n"), MAX_CONTEXT_DESCRIPTION_LENGTH);
};
