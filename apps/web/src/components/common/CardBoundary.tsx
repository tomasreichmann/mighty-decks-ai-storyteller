import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import {
  InlineBoundaryCard,
  RenderErrorBoundary,
} from "./RenderErrorBoundary";

interface CardBoundaryProps {
  children: ReactNode;
  label?: string;
  message?: ReactNode;
  resetKey?: string;
  className?: string;
}

export const CardBoundary = ({
  children,
  label = "Card failed to render",
  message = "This card could not render. The rest of the page is still available.",
  resetKey,
  className = "",
}: CardBoundaryProps): JSX.Element => {
  return (
    <RenderErrorBoundary
      key={resetKey}
      onError={(error, errorInfo) => {
        // Keep card crashes visible in the console without taking down the page.
        // eslint-disable-next-line no-console
        console.error(`Card boundary crashed: ${label}`, error, errorInfo);
      }}
      fallback={() => (
        <InlineBoundaryCard
          label={label}
          message={message}
          className={cn(className)}
        />
      )}
    >
      {children}
    </RenderErrorBoundary>
  );
};
