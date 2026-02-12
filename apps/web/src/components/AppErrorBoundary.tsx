import { Component, type ErrorInfo, type ReactNode } from "react";
import { Text } from "./common/Text";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  public constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = {
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Keep stack traces in dev tools while showing a visible fallback in the UI.
    // eslint-disable-next-line no-console
    console.error("Unhandled UI error", error, errorInfo);
  }

  public override render(): ReactNode {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <main className="app-shell py-8">
        <section className="rounded-lg border border-rose-300 bg-rose-50 p-4">
          <Text as="h1" variant="h3" className="text-rose-800">
            App crashed while rendering
          </Text>
          <Text variant="body" className="mt-2 text-sm text-rose-700">
            This usually means a runtime error in the web app. Please share the
            message below.
          </Text>
          <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-md border border-rose-200 bg-white p-3 text-xs text-kac-iron">
            {this.state.error.stack ?? this.state.error.message}
          </pre>
        </section>
      </main>
    );
  }
}
