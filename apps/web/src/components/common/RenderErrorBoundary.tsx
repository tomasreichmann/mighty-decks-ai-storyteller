import { Component, type ErrorInfo, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Message } from "./Message";
import { Text } from "./Text";

export interface RenderErrorBoundaryFallbackProps {
  error: Error;
  reset: () => void;
}

interface RenderErrorBoundaryProps {
  children: ReactNode;
  fallback: (props: RenderErrorBoundaryFallbackProps) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface RenderErrorBoundaryState {
  error: Error | null;
}

export class RenderErrorBoundary extends Component<
  RenderErrorBoundaryProps,
  RenderErrorBoundaryState
> {
  public constructor(props: RenderErrorBoundaryProps) {
    super(props);
    this.state = {
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): RenderErrorBoundaryState {
    return { error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
  }

  private readonly reset = (): void => {
    this.setState({ error: null });
  };

  public override render(): ReactNode {
    if (!this.state.error) {
      return this.props.children;
    }

    return this.props.fallback({
      error: this.state.error,
      reset: this.reset,
    });
  }
}

interface BoundaryMessageProps {
  title: string;
  message: ReactNode;
  error: Error;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export const BoundaryMessage = ({
  title,
  message,
  error,
  actions,
  className = "",
  contentClassName = "",
}: BoundaryMessageProps): JSX.Element => {
  return (
    <Message
      color="curse"
      label={title}
      className={className}
      contentClassName={cn("stack gap-3", contentClassName)}
    >
      <Text variant="body" color="curse">
        {message}
      </Text>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      <details className="rounded-sm border border-rose-200 bg-white/70 p-3">
        <summary className="cursor-pointer font-ui text-xs font-bold uppercase tracking-[0.08em] text-kac-iron">
          Technical details
        </summary>
        <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap text-xs text-kac-iron">
          {error.stack ?? error.message}
        </pre>
      </details>
    </Message>
  );
};

interface InlineBoundaryCardProps {
  label: string;
  message: ReactNode;
  className?: string;
}

export const InlineBoundaryCard = ({
  label,
  message,
  className = "",
}: InlineBoundaryCardProps): JSX.Element => {
  return (
    <span
      className={cn(
        "inline-flex max-w-[13rem] flex-col rounded-sm border-2 border-dashed border-kac-blood-dark/70 bg-kac-bone-light/70 px-3 py-2 text-left font-ui text-xs text-kac-iron shadow-[2px_2px_0_0_#121b23]",
        className,
      )}
    >
      <span className="font-bold uppercase tracking-[0.08em] text-kac-blood-dark">
        {label}
      </span>
      <span>{message}</span>
    </span>
  );
};
