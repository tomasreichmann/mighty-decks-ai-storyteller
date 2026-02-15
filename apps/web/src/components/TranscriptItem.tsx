import type { TranscriptEntry } from "@mighty-decks/spec/adventureState";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "../utils/cn";
import { Message, type MessageColor } from "./common/Message";
import { type LabelVariant } from "./common/Label";

interface TranscriptItemProps {
  entry: TranscriptEntry;
}

const AI_DEBUG_AUTHOR = "AI Debug";
const AI_IMAGE_SUCCESS_MARKER = "[AI SUCCEEDED] image_generator image";
const METAGAME_QUESTION_PREFIX = "[Metagame]";
const METAGAME_STORYTELLER_AUTHOR = "Storyteller (Metagame)";

const entryStyles: Record<
  TranscriptEntry["kind"],
  {
    className?: string;
    label: string;
    messageColor: MessageColor;
    labelVariant: LabelVariant;
    textClassName: string;
    authorClassName: string;
  }
> = {
  system: {
    className: "self-start",
    label: "System",
    messageColor: "cloth",
    labelVariant: "cloth",
    textClassName: "text-sm font-semibold text-kac-iron-light",
    authorClassName: "text-kac-cloth-dark",
  },
  storyteller: {
    className: "self-start",
    label: "Storyteller",
    messageColor: "gold",
    labelVariant: "gold",
    textClassName: "text-base italic text-kac-iron-dark",
    authorClassName: "text-kac-iron-dark",
  },
  player: {
    className: "self-end",
    label: "Player",
    messageColor: "fire",
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

const formatCredits = (value: number): string => {
  if (value >= 1) {
    return value.toFixed(2);
  }

  if (value >= 0.01) {
    return value.toFixed(4);
  }

  return value.toFixed(6);
};

const formatCount = (value: number): string =>
  new Intl.NumberFormat("en-US").format(value);

const formatAiRequestSummary = (entry: TranscriptEntry): string | null => {
  const request = entry.aiRequest;
  if (!request) {
    return null;
  }

  const labelParts = [request.agent, request.model].filter(
    (value) => value.trim().length > 0,
  );
  const metricParts: string[] = [];
  if (typeof request.usage?.costCredits === "number") {
    metricParts.push(`${formatCredits(request.usage.costCredits)} cr`);
  }
  if (typeof request.usage?.totalTokens === "number") {
    metricParts.push(`${formatCount(request.usage.totalTokens)} tok`);
  } else {
    const promptTokens = request.usage?.promptTokens ?? 0;
    const completionTokens = request.usage?.completionTokens ?? 0;
    const total = promptTokens + completionTokens;
    if (total > 0) {
      metricParts.push(`${formatCount(total)} tok`);
    }
  }

  if (metricParts.length === 0) {
    metricParts.push(request.status);
  }

  const label = labelParts.length > 0 ? labelParts.join(" | ") : "AI request";
  return `${label} | ${metricParts.join(" | ")}`;
};

const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="min-w-0 whitespace-pre-wrap leading-relaxed">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="ml-5 list-disc space-y-1">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="ml-5 list-decimal space-y-1">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => <li>{children}</li>,
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-kac-gold-dark/40 pl-3 italic">
      {children}
    </blockquote>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="rounded bg-kac-bone-light/60 px-1 py-0.5 font-mono text-[0.9em]">
      {children}
    </code>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="overflow-x-auto rounded bg-kac-bone-light/60 p-2 font-mono text-xs">
      {children}
    </pre>
  ),
  a: ({
    href,
    children,
  }: {
    href?: string;
    children?: React.ReactNode;
  }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline decoration-kac-gold-dark/70 underline-offset-2"
    >
      {children}
    </a>
  ),
};

export const TranscriptItem = ({ entry }: TranscriptItemProps): JSX.Element => {
  const isAiDebug = entry.kind === "system" && entry.author === AI_DEBUG_AUTHOR;
  const isMetagameQuestion =
    entry.kind === "player" &&
    entry.text.trimStart().startsWith(METAGAME_QUESTION_PREFIX);
  const isMetagameAnswer =
    entry.kind === "storyteller" &&
    entry.author === METAGAME_STORYTELLER_AUTHOR;
  const isMetagameEntry = isMetagameQuestion || isMetagameAnswer;
  const aiDebugImageUrl = isAiDebug ? extractAiDebugImageUrl(entry.text) : null;
  const aiRequestSummary = formatAiRequestSummary(entry);
  const style = isAiDebug
    ? {
        label: "AI Debug",
        messageColor: "curse" as const,
        labelVariant: "curse" as const,
        textClassName: "text-xs text-kac-iron-light",
        authorClassName: "text-kac-curse-dark",
      }
    : isMetagameEntry
      ? {
          ...entryStyles[entry.kind],
          label: "Metagame",
          messageColor: "cloth" as const,
          labelVariant: "cloth" as const,
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
      label={entry.kind === "player" && authorLabel ? authorLabel : style.label}
      color={style.messageColor}
      labelVariant={style.labelVariant}
      className={cn("min-w-0 max-w-full", style.className)}
      contentClassName="min-w-0"
    >
      {isAiDebug ? (
        <>
          <pre className="max-h-[200px] w-full min-w-0 overflow-x-auto overflow-y-auto whitespace-pre p-2 font-mono text-xs text-kac-iron">
            {entry.text}
          </pre>
          {aiRequestSummary ? (
            <p className="mt-2 text-[11px] text-kac-curse-dark">
              {aiRequestSummary}
            </p>
          ) : null}
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
        <>
          <div
            className={cn(
              "min-w-0 leading-relaxed",
              style.textClassName,
            )}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {entry.text}
            </ReactMarkdown>
          </div>
          {aiRequestSummary ? (
            <p className="mt-2 text-[11px] text-kac-iron-dark/70">
              {aiRequestSummary}
            </p>
          ) : null}
        </>
      )}
    </Message>
  );
};
