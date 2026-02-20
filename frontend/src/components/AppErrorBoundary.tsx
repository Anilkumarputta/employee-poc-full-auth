import React from "react";

type State = {
  hasError: boolean;
};

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[AppErrorBoundary] Unhandled render error:", error);
  }

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
          <div>
            <h1 style={{ margin: "0 0 0.75rem 0", fontSize: "1.4rem" }}>Something went wrong</h1>
            <p style={{ margin: "0 0 1rem 0", color: "#cbd5e1" }}>
              The app hit an unexpected error. Please refresh this page.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
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
              Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
