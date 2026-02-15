import { Button } from "./common/Button";
import { Message } from "./common/Message";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SessionSummaryCardProps {
  summary: string;
  forwardHook?: string;
  onContinueAdventure?: () => void;
  onStartNewAdventure?: () => void;
  onCloseAdventure?: () => void;
}

export const SessionSummaryCard = ({
  summary,
  forwardHook,
  onContinueAdventure,
  onStartNewAdventure,
  onCloseAdventure,
}: SessionSummaryCardProps): JSX.Element => {
  const resolvedSummary =
    summary.trim().length > 0 ? summary.trim() : "Session ended.";
  const resolvedForwardHook =
    forwardHook?.trim().length
      ? forwardHook.trim()
      : "The story continues beyond this chapter.";
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
      <blockquote className="border-l-2 border-kac-iron-dark/30 pl-3 italic">
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
  };

  return (
    <Message
      label="End-of-Session"
      contentClassName="whitespace-normal"
      className="stack gap-4 border-2 border-kac-iron-dark bg-gradient-to-b from-kac-bone-light to-kac-bone px-4 py-4 shadow-[4px_4px_0_0_#121b23]"
    >
      <div className="stack gap-3 text-kac-iron-dark">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {resolvedSummary}
        </ReactMarkdown>
        <div className="border-t border-kac-iron-dark/25 pt-2 italic text-kac-iron-dark/90">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {resolvedForwardHook}
          </ReactMarkdown>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {onContinueAdventure ? (
          <Button
            size="sm"
            variant="solid"
            color="cloth"
            onClick={onContinueAdventure}
          >
            Continue this adventure
          </Button>
        ) : null}
        {onStartNewAdventure ? (
          <Button
            size="sm"
            variant="solid"
            color="gold"
            onClick={onStartNewAdventure}
          >
            Start a new Adventure
          </Button>
        ) : null}
        {onCloseAdventure ? (
          <Button
            size="sm"
            variant="solid"
            color="blood"
            onClick={onCloseAdventure}
          >
            Close Adventure
          </Button>
        ) : null}
      </div>
    </Message>
  );
};
