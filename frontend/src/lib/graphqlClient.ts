// frontend/src/lib/graphqlClient.ts
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function graphqlRequest<T>(
  query: string,
  variables: Record<string, any> = {},
  accessToken?: string | null
): Promise<T> {
  const res = await fetch(`${API_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();

  if (!res.ok || json.errors) {
    console.error("GraphQL error:", json.errors || json);
    throw new Error(json.errors?.[0]?.message || "GraphQL request failed");
  }

  return json.data as T;
}
