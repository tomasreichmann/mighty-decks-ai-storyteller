import type { TranscriptEntry } from "@mighty-decks/spec/adventureState";

export const trimLines = (value: string): string =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

export const shorten = (value: string, maxLength: number): string =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`;

export const AI_DEBUG_AUTHOR = "AI Debug";

export const isAiDebugTranscriptEntry = (entry: TranscriptEntry): boolean =>
  entry.kind === "system" && entry.author === AI_DEBUG_AUTHOR;

export const compactTranscript = (entries: TranscriptEntry[]): string =>
  entries
    .filter((entry) => !isAiDebugTranscriptEntry(entry))
    .slice(-8)
    .map((entry) => `${entry.kind}:${entry.author}: ${entry.text}`)
    .join("\n");

export const getNarrativeTailForOutcomeDecision = (
  transcript: TranscriptEntry[],
): string => {
  const relevant = transcript
    .filter((entry) => !isAiDebugTranscriptEntry(entry))
    .slice(-4)
    .map((entry) => `${entry.kind}:${entry.author}: ${entry.text}`)
    .join("\n");

  if (relevant.length > 0) {
    return relevant.slice(0, 800);
  }

  return "none";
};
