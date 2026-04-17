import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "./Button";
import { BoundaryMessage, RenderErrorBoundary } from "./RenderErrorBoundary";
import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface RouteBoundaryProps {
  children: ReactNode;
  title: string;
  message: ReactNode;
  className?: string;
}

export const RouteBoundary = ({
  children,
  title,
  message,
  className = "app-shell stack gap-4 py-8",
}: RouteBoundaryProps): JSX.Element => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <RenderErrorBoundary
      key={location.pathname}
      onError={(error, errorInfo) => {
        // Preserve the stack in dev tools while giving the user an escape hatch.
        // eslint-disable-next-line no-console
        console.error(
          `Route boundary crashed at ${location.pathname}`,
          error,
          errorInfo,
        );
      }}
      fallback={({ error }) => (
        <div className={cn(className)}>
          <BoundaryMessage
            title={title}
            message={message}
            error={error}
            actions={
              <>
                <Button href="/" variant="solid" color="cloth" size="sm">
                  Home
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  color="cloth"
                  size="sm"
                  onClick={() => navigate(-1)}
                >
                  Back
                </Button>
              </>
            }
          />
        </div>
      )}
    >
      {children}
    </RenderErrorBoundary>
  );
};
