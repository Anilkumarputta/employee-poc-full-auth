import { GRAPHQL_URL } from "../config/api";

type GraphqlRequestOptions = {
  bypassCache?: boolean;
  cacheTtlMs?: number;
};

type CacheEntry = {
  expiresAt: number;
  data: unknown;
};

const DEFAULT_CACHE_TTL_MS = 20000;
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
  if (!token && typeof window !== "undefined") {
    token = localStorage.getItem("accessToken") || undefined;
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
    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
      const message = result.errors.map((e: any) => e.message).join(", ");

      // Auto-logout if backend says token is invalid/expired
      if (message.toLowerCase().includes("not authenticated") || message.toLowerCase().includes("unauthorized")) {
        if (typeof window !== "undefined") {
          console.warn("[graphqlClient] Auth failed, clearing tokens and reloading to login");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          // Do a soft reload to force login view
          window.location.href = "/";
        }
      }

      throw new Error(message);
    }

    const data = result.data as T;

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
