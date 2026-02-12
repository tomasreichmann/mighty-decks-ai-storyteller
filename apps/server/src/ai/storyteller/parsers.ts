import { z } from "zod";
import { trimLines } from "./text";

const extractJsonCandidate = (raw: string): string | null => {
  const trimmed = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return trimmed;
  }

  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");
  if (objectStart >= 0 && objectEnd > objectStart) {
    return trimmed.slice(objectStart, objectEnd + 1);
  }

  const arrayStart = trimmed.indexOf("[");
  const arrayEnd = trimmed.lastIndexOf("]");
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    return trimmed.slice(arrayStart, arrayEnd + 1);
  }

  return null;
};

const normalizeLabel = (value: string): string =>
  value.toLowerCase().replace(/[\s_-]/g, "");

const uniqueStrings = (values: string[]): string[] => {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const trimmed = trimLines(value);
    if (trimmed.length === 0 || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    output.push(trimmed);
  }

  return output;
};

const parseInlineStringArray = (rawValue: string): string[] => {
  const trimmed = rawValue.trim();
  if (trimmed.length === 0) {
    return [];
  }

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is string => typeof item === "string",
        );
      }
    } catch {
      // Continue with plain-text parsing below.
    }
  }

  const splitCandidates = [" | ", "; "];
  for (const separator of splitCandidates) {
    if (trimmed.includes(separator)) {
      return trimmed
        .split(separator)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
  }

  return [trimmed];
};

export interface LooseSceneStart {
  introProse?: string;
  orientationBullets?: string[];
  playerPrompt?: string;
  tension?: number;
  secrets?: string[];
  pacingNotes?: string[];
  continuityWarnings?: string[];
}

export const parseLooseSceneStart = (raw: string): LooseSceneStart | null => {
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  if (cleaned.length === 0) {
    return null;
  }

  const lines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const introParts: string[] = [];
  const orientationBullets: string[] = [];
  const playerPromptParts: string[] = [];
  const secrets: string[] = [];
  const pacingNotes: string[] = [];
  const continuityWarnings: string[] = [];
  let tension: number | undefined;
  let section:
    | "introProse"
    | "orientationBullets"
    | "playerPrompt"
    | "secrets"
    | "pacingNotes"
    | "continuityWarnings"
    | null = null;

  for (const line of lines) {
    const keyMatch = line.match(/^([A-Za-z][A-Za-z0-9 _-]*):\s*(.*)$/);
    if (keyMatch) {
      const label = normalizeLabel(keyMatch[1] ?? "");
      const value = keyMatch[2]?.trim() ?? "";

      if (label === "introprose") {
        section = "introProse";
        if (value.length > 0) {
          introParts.push(value);
        }
        continue;
      }

      if (label === "orientationbullets") {
        section = "orientationBullets";
        orientationBullets.push(...parseInlineStringArray(value));
        continue;
      }

      if (
        label === "playerprompt" ||
        label === "actionprompt" ||
        label === "playeractionprompt"
      ) {
        section = "playerPrompt";
        if (value.length > 0) {
          playerPromptParts.push(value);
        }
        continue;
      }

      if (label === "tension") {
        section = null;
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          tension = Math.max(0, Math.min(100, parsed));
        }
        continue;
      }

      if (label === "secrets") {
        section = "secrets";
        secrets.push(...parseInlineStringArray(value));
        continue;
      }

      if (label === "pacingnotes") {
        section = "pacingNotes";
        pacingNotes.push(...parseInlineStringArray(value));
        continue;
      }

      if (label === "continuitywarnings") {
        section = "continuityWarnings";
        continuityWarnings.push(...parseInlineStringArray(value));
        continue;
      }
    }

    const listLine = line
      .replace(/^[-*]\s+/, "")
      .replace(/^\d+\.\s+/, "")
      .trim();
    if (listLine.length === 0) {
      continue;
    }

    if (section === "orientationBullets") {
      orientationBullets.push(listLine);
      continue;
    }

    if (section === "playerPrompt") {
      playerPromptParts.push(listLine);
      continue;
    }

    if (section === "secrets") {
      secrets.push(listLine);
      continue;
    }

    if (section === "pacingNotes") {
      pacingNotes.push(listLine);
      continue;
    }

    if (section === "continuityWarnings") {
      continuityWarnings.push(listLine);
      continue;
    }

    if (section === "introProse") {
      introParts.push(listLine);
    }
  }

  const introProse = trimLines(introParts.join("\n")).slice(0, 700);
  const normalizedBullets = uniqueStrings(orientationBullets).slice(0, 4);
  const playerPrompt = trimLines(playerPromptParts.join("\n")).slice(0, 320);
  const normalizedSecrets = uniqueStrings(secrets);
  const normalizedPacingNotes = uniqueStrings(pacingNotes);
  const normalizedContinuityWarnings = uniqueStrings(continuityWarnings);

  if (introProse.length === 0 && normalizedBullets.length === 0) {
    return null;
  }

  return {
    introProse: introProse.length > 0 ? introProse : undefined,
    orientationBullets: normalizedBullets,
    playerPrompt: playerPrompt.length > 0 ? playerPrompt : undefined,
    tension,
    secrets: normalizedSecrets,
    pacingNotes: normalizedPacingNotes,
    continuityWarnings: normalizedContinuityWarnings,
  };
};

export const parseJson = <T>(raw: string, schema: z.ZodType<T>): T | null => {
  const candidate = extractJsonCandidate(raw);
  if (!candidate) {
    return null;
  }

  try {
    const parsed = JSON.parse(candidate) as unknown;
    return schema.parse(parsed);
  } catch {
    return null;
  }
};
