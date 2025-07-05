import { Component, ReactNode } from "react";
import { Button } from "./ui/button";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-background flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="space-y-2">
              <h1 className="text-foreground text-2xl font-medium">
                Something went wrong
              </h1>
              <p className="text-muted-foreground">
                We encountered an unexpected error. Please try refreshing the
                page.
              </p>
            </div>

            <div className="flex items-center justify-center gap-x-4">
              <Button
                onClick={() => window.location.reload()}
                variant="default"
                size={"sm"}
              >
                Refresh Page
              </Button>

              <Button
                onClick={() =>
                  this.setState({ hasError: false, error: undefined })
                }
                variant="outline"
                size={"sm"}
              >
                Try Again
              </Button>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="text-left">
                <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-sm">
                  Error Details (Development)
                </summary>
                <pre className="bg-muted mt-2 overflow-auto rounded-md p-3 text-xs">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
