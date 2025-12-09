const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const GRAPHQL_URL = `${API_URL}/graphql`;

export async function graphqlRequest<T = any>(
  query: string,
  variables: Record<string, any> = {},
  accessToken?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
    console.log('[graphqlClient] Request with auth token');
  } else {
    console.warn('[graphqlClient] Request without auth token!');
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
    throw new Error(result.errors.map((e: any) => e.message).join(", "));
  }

  return result.data as T;
}
