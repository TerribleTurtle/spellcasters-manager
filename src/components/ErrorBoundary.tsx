import { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleCopyError = () => {
    const text = `Error: ${this.state.error?.message}\n\nStack:\n${this.state.errorInfo?.componentStack || ''}`;
    navigator.clipboard.writeText(text);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
          <div className="max-w-md w-full bg-card border border-destructive/50 rounded-lg shadow-lg p-6 space-y-6">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">Something went wrong</h2>
              <p className="text-sm text-muted-foreground">
                The application encountered an unexpected error.
              </p>
            </div>

            <div className="bg-muted/50 p-3 rounded-md text-left overflow-auto max-h-40 border border-border">
              <code className="text-xs font-mono text-destructive">
                {this.state.error?.message || "Unknown error"}
              </code>
            </div>

            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={this.handleCopyError} className="gap-2">
                <Copy className="w-4 h-4" />
                Copy Details
              </Button>
              <Button onClick={this.handleReload} className="gap-2">
                <RefreshCcw className="w-4 h-4" />
                Reload Application
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
