export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/$/, "") + "/";

const BASE = API_BASE;

const COOKIE = "admin_token";
const CSRF_COOKIE = "csrf_token";
// SameSite=Strict prevents CSRF. Not HttpOnly so the Authorization header can
// still be set on cross-origin backend requests; a Route Handler proxy would be
// required to make this fully HttpOnly.
// max-age = levensduur van de refresh token (30 dagen): de access token in de
// cookie mag verlopen, die wordt dan automatisch ververst via /auth/refresh.
const SESSION_MAX_AGE_S = 30 * 24 * 60 * 60;
const COOKIE_OPTS = "path=/; SameSite=Strict";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = new RegExp(`(?:^|; )${name}=([^;]*)`).exec(document.cookie);
  return m ? decodeURIComponent(m[1]) : null;
}

function writeCookie(name: string, value: string): void {
  const secure = globalThis.location?.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; ${COOKIE_OPTS}; max-age=${SESSION_MAX_AGE_S}${secure}`;
}

export function getToken(): string | null {
  return readCookie(COOKIE);
}

export function setToken(token: string, csrfToken?: string): void {
  writeCookie(COOKIE, token);
  if (csrfToken) writeCookie(CSRF_COOKIE, csrfToken);
}

export function clearToken(): void {
  document.cookie = `${COOKIE}=; ${COOKIE_OPTS}; max-age=0`;
  document.cookie = `${CSRF_COOKIE}=; ${COOKIE_OPTS}; max-age=0`;
}

/** Seconden tot de access token verloopt (negatief = al verlopen). */
function secondsUntilExpiry(token: string): number {
  try {
    const part = token.split(".")[1];
    const { exp } = JSON.parse(atob(part.replaceAll("-", "+").replaceAll("_", "/"))) as { exp?: number };
    return typeof exp === "number" ? exp - Date.now() / 1000 : Infinity;
  } catch {
    return -1;
  }
}

let refreshInFlight: Promise<string | null> | null = null;

/**
 * Vraagt een nieuwe access token aan met de refresh cookie (httpOnly, op het
 * backend-domein). Gelijktijdige aanroepen delen één request: de backend
 * roteert de refresh token, een tweede parallelle refresh zou falen.
 */
export function refreshAccessToken(): Promise<string | null> {
  refreshInFlight ??= (async () => {
    const before = getToken();
    try {
      const res = await fetch(`${BASE}auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "x-csrf-token": readCookie(CSRF_COOKIE) ?? "" },
      });
      if (res.ok) {
        const data = (await res.json()) as { accessToken: string; csrfToken: string };
        setToken(data.accessToken, data.csrfToken);
        return data.accessToken;
      }
    } catch {
      /* netwerkfout: hieronder behandeld als mislukte refresh */
    }
    // Een ander tabblad kan net gerefresht hebben (en onze refresh token
    // geroteerd): gebruik dan diens verse token.
    const now = getToken();
    if (now && now !== before && secondsUntilExpiry(now) > 0) return now;
    return null;
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

function redirectToLogin(): void {
  clearToken();
  if (globalThis.window !== undefined && globalThis.location.pathname !== "/login") {
    globalThis.location.replace("/login");
  }
}

export function getTokenPayload(): { role?: string; username?: string; email?: string } | null {
  const token = getToken();
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    return JSON.parse(atob(part.replaceAll("-", "+").replaceAll("_", "/"))) as {
      role?: string;
      username?: string;
      email?: string;
    };
  } catch {
    return null;
  }
}

export async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  // Auth-routes (login, register, refresh…) zelf nooit refreshen of retryen.
  const isAuthCall = path.startsWith("auth/");

  let token = getToken();
  // Bijna verlopen? Eerst verversen, zo faalt het request niet onnodig.
  if (token && !isAuthCall && secondsUntilExpiry(token) < 30) {
    token = (await refreshAccessToken()) ?? token;
  }

  const send = (bearer: string | null) =>
    fetch(`${BASE}${path}`, {
      ...init,
      // Nodig zodat de browser de refresh/csrf cookies van login bewaart.
      ...(isAuthCall ? { credentials: "include" as const } : {}),
      headers: {
        "Content-Type": "application/json",
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        ...(init?.headers as Record<string, string> | undefined),
      },
    });

  let res = await send(token);

  if (res.status === 401 && token && !isAuthCall) {
    const fresh = await refreshAccessToken();
    if (fresh) {
      res = await send(fresh);
    }
  }

  if (!res.ok) {
    if (res.status === 401 && !isAuthCall) redirectToLogin();
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
  // 204 No Content (bv. na DELETE) heeft geen body: res.json() zou dan gooien.
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
