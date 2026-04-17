import type { ReactNode } from "react";
import { BoundaryMessage, RenderErrorBoundary } from "./common/RenderErrorBoundary";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

export const AppErrorBoundary = ({
  children,
}: AppErrorBoundaryProps): JSX.Element => {
  return (
    <RenderErrorBoundary
      onError={(error, errorInfo) => {
        // Keep stack traces in dev tools while showing a visible fallback in the UI.
        // eslint-disable-next-line no-console
        console.error("Unhandled UI error", error, errorInfo);
      }}
      fallback={({ error }) => (
        <main className="app-shell flex min-h-[100dvh] items-center py-8">
          <BoundaryMessage
            title="App crashed while rendering"
            message="This usually means a runtime error in the web app. Please share the message below."
            error={error}
          />
        </main>
      )}
    >
      {children}
    </RenderErrorBoundary>
  );
};
