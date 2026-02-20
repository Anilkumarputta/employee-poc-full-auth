import { GRAPHQL_URL } from "../config/api";
import { trackClientError } from "./errorTracking";
import { getStorageItem, removeStorageItem } from "./safeStorage";

type GraphqlRequestOptions = {
  bypassCache?: boolean;
  cacheTtlMs?: number;
  validate?: (data: unknown) => boolean;
};

type CacheEntry = {
  expiresAt: number;
  data: unknown;
};

const DEFAULT_CACHE_TTL_MS = 20000;
const REQUEST_TIMEOUT_MS = 12000;
const responseCache = new Map<string, CacheEntry>();
const inflightRequests = new Map<string, Promise<unknown>>();

function normalizeQuery(query: string): string {
  return query.replace(/\s+/g, " ").trim();
}

function getCacheKey(query: string, variables: Record<string, any>, token?: string | null) {
  return `${token || "anon"}::${normalizeQuery(query)}::${JSON.stringify(variables)}`;
}

function isMutationOperation(query: string) {
  return /^mutation\b/i.test(query.trimStart());
}

export function clearGraphqlCache() {
  responseCache.clear();
  inflightRequests.clear();
}

export async function graphqlRequest<T = any>(
  query: string,
  variables: Record<string, any> = {},
  accessToken?: string | null,
  options: GraphqlRequestOptions = {}
): Promise<T> {
  // Ensure a token is sent even if the caller forgot to pass it.
  let token = accessToken;
  if (!token) {
    token = getStorageItem("accessToken") || undefined;
  }

  const isMutation = isMutationOperation(query);
  const useCache = !isMutation && !options.bypassCache;
  const cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
  const cacheKey = getCacheKey(query, variables, token);

  if (useCache) {
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as T;
    }

    const inflight = inflightRequests.get(cacheKey);
    if (inflight) {
      return inflight as Promise<T>;
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const requestPromise = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });
    } catch (error: any) {
      if (error?.name === "AbortError") {
        throw new Error("Request timed out. Please try again.");
      }
      trackClientError(error, "graphql.network", { query: normalizeQuery(query) });
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const payload = result as { data?: unknown; errors?: Array<{ message?: string }> };

    if (payload.errors) {
      const message = payload.errors.map((e: any) => e.message).join(", ");
      trackClientError(new Error(message), "graphql.response", {
        query: normalizeQuery(query),
      });

      // Auto-logout if backend says token is invalid/expired
      if (message.toLowerCase().includes("not authenticated") || message.toLowerCase().includes("unauthorized")) {
        if (typeof window !== "undefined") {
          console.warn("[graphqlClient] Auth failed, clearing tokens and reloading to login");
          removeStorageItem("accessToken");
          removeStorageItem("refreshToken");
          removeStorageItem("user");
          // Do a soft reload to force login view
          window.location.href = "/";
        }
      }

      throw new Error(message);
    }

    if (typeof payload.data === "undefined") {
      throw new Error("Invalid GraphQL response: missing data");
    }

    if (options.validate && !options.validate(payload.data)) {
      const validationError = new Error("Invalid GraphQL response shape");
      trackClientError(validationError, "graphql.validation", {
        query: normalizeQuery(query),
      });
      throw validationError;
    }

    const data = payload.data as T;

    if (isMutation) {
      // Mutations can change list/query responses, so invalidate stale cache.
      clearGraphqlCache();
    } else if (useCache) {
      responseCache.set(cacheKey, {
        expiresAt: Date.now() + cacheTtlMs,
        data,
      });
    }

    return data;
  })();

  if (!useCache) {
    return requestPromise;
  }

  inflightRequests.set(cacheKey, requestPromise as Promise<unknown>);
  try {
    return await requestPromise;
  } finally {
    inflightRequests.delete(cacheKey);
  }
}
