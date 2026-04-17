import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { BoundaryMessage, RenderErrorBoundary } from "./RenderErrorBoundary";

interface SectionBoundaryProps {
  children: ReactNode;
  title: string;
  message: ReactNode;
  resetKey?: string;
  className?: string;
}

export const SectionBoundary = ({
  children,
  title,
  message,
  resetKey,
  className = "",
}: SectionBoundaryProps): JSX.Element => {
  return (
    <RenderErrorBoundary
      key={resetKey}
      onError={(error, errorInfo) => {
        // The page keeps its shell visible, so we only need a concise console trace.
        // eslint-disable-next-line no-console
        console.error(`Section boundary crashed: ${title}`, error, errorInfo);
      }}
      fallback={({ error }) => (
        <div className={cn(className)}>
          <BoundaryMessage title={title} message={message} error={error} />
        </div>
      )}
    >
      {children}
    </RenderErrorBoundary>
  );
};
