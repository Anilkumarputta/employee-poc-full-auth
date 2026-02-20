import React from "react";
import { clearGraphqlCache } from "../lib/graphqlClient";
import { trackClientError } from "../lib/errorTracking";
import { removeStorageItem } from "../lib/safeStorage";

type State = {
  hasError: boolean;
  errorMessage?: string;
};

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.setState({ errorMessage });
    trackClientError(error, "react.error-boundary");
    console.error("[AppErrorBoundary] Unhandled render error:", error);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, errorMessage: undefined });
  };

  private handleResetSession = () => {
    clearGraphqlCache();
    removeStorageItem("accessToken");
    removeStorageItem("refreshToken");
    removeStorageItem("user");
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#0f172a",
            color: "#ffffff",
            padding: "1rem",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: "540px" }}>
            <h1 style={{ margin: "0 0 0.75rem 0", fontSize: "1.4rem" }}>Something went wrong</h1>
            <p style={{ margin: "0 0 1rem 0", color: "#cbd5e1" }}>
              The app hit an unexpected error. Please refresh this page.
            </p>
            {this.state.errorMessage ? (
              <p style={{ margin: "0 0 1rem 0", color: "#94a3b8", fontSize: "0.9rem" }}>
                Error: {this.state.errorMessage}
              </p>
            ) : null}
            <div style={{ display: "inline-flex", gap: "0.65rem", flexWrap: "wrap", justifyContent: "center" }}>
              <button
                type="button"
                onClick={this.handleRetry}
                style={{
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.65rem 1rem",
                  background: "#2563eb",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
              <button
                type="button"
                onClick={this.handleResetSession}
                style={{
                  border: "1px solid #475569",
                  borderRadius: "8px",
                  padding: "0.65rem 1rem",
                  background: "transparent",
                  color: "#cbd5e1",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Reset app data
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
