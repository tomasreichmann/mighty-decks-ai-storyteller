import type { TranscriptEntry } from "@mighty-decks/spec/adventureState";
import { cn } from "../utils/cn";

interface TranscriptItemProps {
  entry: TranscriptEntry;
}

const AI_DEBUG_AUTHOR = "AI Debug";
const AI_IMAGE_SUCCESS_MARKER = "[AI SUCCEEDED] image_generator image";

const entryStyles: Record<
  TranscriptEntry["kind"],
  { badge: string; container: string; label: string }
> = {
  system: {
    badge: "bg-slate-200 text-slate-700",
    container: "border-slate-300 bg-slate-50",
    label: "System",
  },
  storyteller: {
    badge: "bg-amber-200 text-amber-900",
    container: "border-amber-300 bg-amber-50",
    label: "Storyteller",
  },
  player: {
    badge: "bg-teal-200 text-teal-900",
    container: "border-teal-300 bg-teal-50",
    label: "Player",
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
        badge: "bg-sky-200 text-sky-900",
        container: "border-sky-300 bg-sky-50",
        label: "AI Debug",
      }
    : entryStyles[entry.kind];
  const authorLabel =
    !isAiDebug &&
    (entry.kind === "player" ||
      (entry.kind === "system" && entry.author !== "System"))
      ? entry.author
      : null;

  return (
    <article
      className={cn(
        "min-w-0 max-w-full rounded-md border px-3 py-2",
        style.container,
      )}
    >
      {isAiDebug ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                style.badge,
              )}
            >
              {style.label}
            </span>
          </div>
          <pre className="mt-2 max-h-[300px] w-full min-w-0 overflow-x-auto overflow-y-auto whitespace-pre rounded-md bg-sky-100 p-2 font-mono text-xs text-slate-800">
            {entry.text}
          </pre>
          {aiDebugImageUrl ? (
            <div className="mt-2 overflow-hidden rounded-md border border-sky-200 bg-sky-100">
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
            "min-w-0 whitespace-pre-wrap leading-relaxed text-slate-800",
          )}
        >
          <span
            className={cn(
              "mr-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
              style.badge,
            )}
          >
            {style.label}
          </span>
          {authorLabel ? (
            <span className="mr-2 text-xs font-medium text-slate-600">
              {authorLabel}
            </span>
          ) : null}
          <span
            className={cn(
              entry.kind === "storyteller" ? "text-base italic" : "text-sm",
            )}
          >
            {entry.text}
          </span>
        </p>
      )}
    </article>
  );
};
