import test from "node:test";
import assert from "node:assert/strict";
import { Component, useState, type ErrorInfo, type ReactNode } from "react";
import TestRenderer, { act } from "react-test-renderer";

interface BoundaryFallbackProps {
  error: Error;
  reset: () => void;
}

class ResettableBoundary extends Component<
  {
    children: ReactNode;
    fallback: (props: BoundaryFallbackProps) => ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  },
  { error: Error | null }
> {
  public constructor(
    props: {
      children: ReactNode;
      fallback: (props: BoundaryFallbackProps) => ReactNode;
      onError?: (error: Error, errorInfo: ErrorInfo) => void;
    },
  ) {
    super(props);
    this.state = { error: null };
  }

  public static getDerivedStateFromError(error: Error): { error: Error } {
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

const Boom = ({ shouldThrow }: { shouldThrow: boolean }): JSX.Element => {
  if (shouldThrow) {
    throw new Error("boom");
  }

  return <p>Recovered</p>;
};

test("RenderErrorBoundary shows a fallback and recovers after reset", () => {
  const originalConsoleError = console.error;
  console.error = () => undefined;

  try {
    let renderer: TestRenderer.ReactTestRenderer | null = null;

    const Harness = (): JSX.Element => {
      const [shouldThrow, setShouldThrow] = useState(true);

      return (
        <ResettableBoundary
          fallback={({ error, reset }) => (
            <div>
              <span>{error.message}</span>
              <button
                type="button"
                onClick={() => {
                  setShouldThrow(false);
                  reset();
                }}
              >
                Try again
              </button>
            </div>
          )}
        >
          <Boom shouldThrow={shouldThrow} />
        </ResettableBoundary>
      );
    };

    act(() => {
      renderer = TestRenderer.create(<Harness />);
    });

    if (!renderer) {
      throw new Error("Renderer was not created");
    }

    const rendered = renderer as TestRenderer.ReactTestRenderer;
    assert.match(rendered.root.findByType("span").children.join(""), /boom/);

    act(() => {
      rendered.root.findByType("button").props.onClick();
    });

    assert.match(rendered.root.findByType("p").children.join(""), /Recovered/);
  } finally {
    console.error = originalConsoleError;
  }
});
