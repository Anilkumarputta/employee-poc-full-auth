const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

type AuthResponse = {
  user: { id: number; email: string; role: "admin" | "employee" };
  accessToken: string;
  refreshToken: string;
};

export async function apiLogin(email: string, password: string) {
  console.log('[apiLogin] Logging in as:', email);
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.log('[apiLogin] ❌ Login failed:', res.status, errorText);
    throw new Error("Login failed");
  }
  const data = await res.json() as AuthResponse;
  console.log('[apiLogin] ✅ Received response:', {
    user: data.user.email,
    hasAccessToken: !!data.accessToken,
    hasRefreshToken: !!data.refreshToken,
  });
  return data;
}

export async function apiRegister(
  email: string,
  password: string,
  role: "admin" | "employee"
) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
  if (!res.ok) throw new Error("Register failed");
  return (await res.json()) as AuthResponse;
}

export async function apiGoogleLogin(email: string, name: string) {
  const res = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name }),
  });
  if (!res.ok) throw new Error("Google login failed");
  return (await res.json()) as AuthResponse;
}

export async function apiForgotPassword(email: string) {
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error("Request failed");
  return await res.json();
}
