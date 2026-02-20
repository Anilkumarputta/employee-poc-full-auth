import { API_URL } from "../config/api";

export type BackendAuthRole = "admin" | "director" | "manager" | "employee";
export type FrontendAuthRole = "director" | "manager" | "employee";

type AuthResponse = {
  user: { id: number; email: string; role: BackendAuthRole };
  accessToken: string;
  refreshToken: string;
};

export function toFrontendRole(role: BackendAuthRole): FrontendAuthRole {
  // Keep backwards compatibility with older "admin" accounts.
  if (role === "admin") return "director";
  return role;
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.error || "Login failed");
  }

  return (await res.json()) as AuthResponse;
}

export async function apiRegister(email: string, password: string, role: BackendAuthRole) {
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

// Messaging API
export async function fetchMessages(conversationId?: string) {
  const url = conversationId
    ? `${API_URL}/messages?conversationId=${conversationId}`
    : `${API_URL}/messages`;
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch messages");
  return await res.json();
}

export async function sendMessage({
  conversationId,
  message,
  replyToId,
}: {
  conversationId: string;
  message: string;
  replyToId?: number;
}) {
  const res = await fetch(`${API_URL}/messages/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ conversationId, message, replyToId }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return await res.json();
}

export async function markAsRead(conversationId: string) {
  const res = await fetch(`${API_URL}/messages/mark-read`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ conversationId }),
  });
  if (!res.ok) throw new Error("Failed to mark as read");
  return await res.json();
}
