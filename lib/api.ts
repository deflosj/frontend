export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/$/, "") + "/";

const BASE = API_BASE;

const COOKIE = "admin_token";
// SameSite=Strict prevents CSRF. Not HttpOnly so the Authorization header can
// still be set on cross-origin backend requests; a Route Handler proxy would be
// required to make this fully HttpOnly.
const COOKIE_OPTS = "path=/; SameSite=Strict";

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const m = new RegExp(`(?:^|; )${COOKIE}=([^;]*)`).exec(document.cookie);
  return m ? decodeURIComponent(m[1]) : null;
}

export function setToken(token: string): void {
  document.cookie = `${COOKIE}=${encodeURIComponent(token)}; ${COOKIE_OPTS}`;
}

export function clearToken(): void {
  document.cookie = `${COOKIE}=; ${COOKIE_OPTS}; max-age=0`;
}

export function getTokenPayload(): { role?: string; username?: string } | null {
  const token = getToken();
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    return JSON.parse(atob(part.replaceAll("-", "+").replaceAll("_", "/"))) as {
      role?: string;
      username?: string;
    };
  } catch {
    return null;
  }
}

export async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
      if (globalThis.window !== undefined) globalThis.location.replace("/login");
    }
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}
