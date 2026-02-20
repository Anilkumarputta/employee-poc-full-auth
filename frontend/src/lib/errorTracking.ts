import { API_URL } from "../config/api";

type ErrorPayload = {
  message: string;
  stack?: string;
  source?: string;
  metadata?: Record<string, unknown>;
  url?: string;
  userAgent?: string;
  timestamp: string;
};

const ERROR_ENDPOINT = `${API_URL}/client-errors`;
const RECENT_ERROR_CACHE_MS = 5000;
const recentErrors = new Map<string, number>();

function shouldSendError(signature: string): boolean {
  const now = Date.now();
  const previous = recentErrors.get(signature);

  if (typeof previous === "number" && now - previous < RECENT_ERROR_CACHE_MS) {
    return false;
  }

  recentErrors.set(signature, now);
  return true;
}

function buildSignature(payload: ErrorPayload): string {
  return `${payload.source || "unknown"}::${payload.message}`;
}

export function trackClientError(error: unknown, source: string, metadata?: Record<string, unknown>) {
  try {
    const normalized = error instanceof Error ? error : new Error(String(error));
    const payload: ErrorPayload = {
      message: normalized.message || "Unknown client error",
      stack: normalized.stack,
      source,
      metadata,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      timestamp: new Date().toISOString(),
    };

    const signature = buildSignature(payload);
    if (!shouldSendError(signature)) {
      return;
    }

    if (typeof window !== "undefined") {
      void fetch(ERROR_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {
        // Never fail app flow for telemetry.
      });
    }
  } catch {
    // Ignore telemetry failures by design.
  }
}

