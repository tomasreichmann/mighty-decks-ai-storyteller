import type { TranscriptEntry } from "@mighty-decks/spec/adventureState";
import { cn } from "../utils/cn";
import { Message, type MessageVariant } from "./common/Message";
import { type LabelVariant } from "./common/Label";

interface TranscriptItemProps {
  entry: TranscriptEntry;
}

const AI_DEBUG_AUTHOR = "AI Debug";
const AI_IMAGE_SUCCESS_MARKER = "[AI SUCCEEDED] image_generator image";

const entryStyles: Record<
  TranscriptEntry["kind"],
  {
    label: string;
    messageVariant: MessageVariant;
    labelVariant: LabelVariant;
    textClassName: string;
    authorClassName: string;
  }
> = {
  system: {
    label: "System",
    messageVariant: "cloth",
    labelVariant: "cloth",
    textClassName: "text-sm font-semibold text-kac-iron-light",
    authorClassName: "text-kac-cloth-dark",
  },
  storyteller: {
    label: "Storyteller",
    messageVariant: "gold",
    labelVariant: "gold",
    textClassName: "text-base italic text-kac-iron-dark",
    authorClassName: "text-kac-iron-dark",
  },
  player: {
    label: "Player",
    messageVariant: "fire",
    labelVariant: "fire",
    textClassName: "text-sm text-kac-iron-light",
    authorClassName: "text-kac-iron-dark",
  },
};

const normalizeImageCandidate = (value: string): string | null => {
  const trimmed = value.trim().replace(/^["']|["']$/g, "");
  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.startsWith("data:image/")) {
    return trimmed;
  }

  try {
    const parsedUrl = new URL(trimmed);
    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return parsedUrl.toString();
    }
  } catch {
    return null;
  }

  return null;
};

const readImageFromJsonLike = (raw: string): string | null => {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === "string") {
      return normalizeImageCandidate(parsed);
    }

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const candidates = [
      (parsed as Record<string, unknown>).url,
      (parsed as Record<string, unknown>).imageUrl,
      (parsed as Record<string, unknown>).image_url,
      (parsed as Record<string, unknown>).b64_json,
    ];

    for (const candidate of candidates) {
      if (typeof candidate !== "string") {
        continue;
      }

      if (candidate && candidate.startsWith("data:image/")) {
        return candidate;
      }

      if ((parsed as Record<string, unknown>).b64_json === candidate) {
        return `data:image/png;base64,${candidate}`;
      }

      const normalized = normalizeImageCandidate(candidate);
      if (normalized) {
        return normalized;
      }
    }
  } catch {
    return null;
  }

  return null;
};

const extractAiDebugImageUrl = (text: string): string | null => {
  if (!text.includes(AI_IMAGE_SUCCESS_MARKER)) {
    return null;
  }

  const responseIndex = text.indexOf("Response:");
  if (responseIndex < 0) {
    return null;
  }

  const responseBlock = text.slice(responseIndex + "Response:".length).trim();
  const jsonImage = readImageFromJsonLike(responseBlock);
  if (jsonImage) {
    return jsonImage;
  }

  const markdownImageMatch = responseBlock.match(/!\[[^\]]*]\(([^)]+)\)/);
  if (markdownImageMatch?.[1]) {
    const normalized = normalizeImageCandidate(markdownImageMatch[1]);
    if (normalized) {
      return normalized;
    }
  }

  const dataUriMatch = responseBlock.match(
    /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/,
  );
  if (dataUriMatch?.[0]) {
    return dataUriMatch[0];
  }

  const urlMatch = responseBlock.match(/https?:\/\/[^\s"'`<>]+/i);
  if (urlMatch?.[0]) {
    const normalized = normalizeImageCandidate(urlMatch[0]);
    if (normalized) {
      return normalized;
    }
  }

  return null;
};

export const TranscriptItem = ({ entry }: TranscriptItemProps): JSX.Element => {
  const isAiDebug = entry.kind === "system" && entry.author === AI_DEBUG_AUTHOR;
  const aiDebugImageUrl = isAiDebug ? extractAiDebugImageUrl(entry.text) : null;
  const style = isAiDebug
    ? {
        label: "AI Debug",
        messageVariant: "curse" as const,
        labelVariant: "curse" as const,
        textClassName: "text-xs text-kac-iron-light",
        authorClassName: "text-kac-curse-dark",
      }
    : entryStyles[entry.kind];
  const authorLabel =
    !isAiDebug &&
    (entry.kind === "player" ||
      (entry.kind === "system" && entry.author !== "System"))
      ? entry.author
      : null;

  return (
    <Message
      label={style.label}
      variant={style.messageVariant}
      labelVariant={style.labelVariant}
      className="min-w-0 max-w-full"
      contentClassName="min-w-0"
    >
      {isAiDebug ? (
        <>
          <pre className="max-h-[300px] w-full min-w-0 overflow-x-auto overflow-y-auto whitespace-pre p-2 font-mono text-xs text-kac-iron">
            {entry.text}
          </pre>
          {aiDebugImageUrl ? (
            <div className="mt-2 overflow-hidden">
              <img
                src={aiDebugImageUrl}
                alt="AI debug generated scene"
                loading="lazy"
                className="h-auto max-h-64 w-full object-cover"
              />
            </div>
          ) : null}
        </>
      ) : (
        <p
          className={cn(
            "min-w-0 whitespace-pre-wrap leading-relaxed",
            style.textClassName,
          )}
        >
          {authorLabel ? (
            <span
              className={cn(
                "mr-2 inline-block align-middle font-semibold uppercase tracking-[0.04em]",
                style.authorClassName,
                entry.kind === "storyteller" ? "text-xs" : "text-[11px]",
              )}
            >
              {authorLabel}
            </span>
          ) : null}
          <span>{entry.text}</span>
        </p>
      )}
    </Message>
  );
};
