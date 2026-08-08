import React from "react";
import { RefreshCw } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-destructive" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Etwas ist schiefgelaufen</h1>
            <p className="text-muted-foreground">
              Ein unerwarteter Fehler ist aufgetreten. Bitte versuche die Seite neu zu laden.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4 text-left bg-muted p-3 rounded text-sm text-muted-foreground overflow-auto max-h-48">
                <summary className="cursor-pointer font-mono font-semibold mb-2">Details (Dev-Modus)</summary>
                <pre className="whitespace-pre-wrap break-words">{this.state.error.toString()}</pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Seite neu laden
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
