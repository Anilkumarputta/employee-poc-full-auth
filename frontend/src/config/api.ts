const LOCAL_API_URL = "http://localhost:4000";
const PROD_API_URL = "https://employee-poc-full-auth.onrender.com";

export const API_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? LOCAL_API_URL : PROD_API_URL);

export const GRAPHQL_URL = `${API_URL}/graphql`;
