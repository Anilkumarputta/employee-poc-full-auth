import { GRAPHQL_URL } from "../config/api";

export async function graphqlRequest<T = any>(
  query: string,
  variables: Record<string, any> = {},
  accessToken?: string | null
): Promise<T> {
  // Ensure a token is sent even if the caller forgot to pass it.
  let token = accessToken;
  if (!token && typeof window !== "undefined") {
    token = localStorage.getItem("accessToken") || undefined;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

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

  return result.data as T;
}
