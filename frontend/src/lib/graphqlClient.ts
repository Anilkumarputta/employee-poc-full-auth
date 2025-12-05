const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function graphqlRequest<T = any>(
  query: string,
  variables: Record<string, any> = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/graphql`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const json = await response.json();

  if (json.errors) {
    throw new Error(json.errors[0]?.message || "GraphQL Error");
  }

  return json.data;
}
