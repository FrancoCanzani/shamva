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

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="space-y-2">
              <h1 className="text-2xl font-medium text-foreground">
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
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 p-3 bg-muted text-xs overflow-auto rounded-md">
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
