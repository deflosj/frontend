import { API_BASE, apiFetch, getToken, setToken, clearToken } from "@/lib/api";

interface LoginResponse {
  accessToken: string;
  csrfToken: string;
  user: { id: number; username: string; role: string };
}

export interface AuthUser {
  id: number;
  username: string;
  role: string;
}

const AuthService = {
  async login(identifier: string, password: string): Promise<AuthUser> {
    const data = await apiFetch<LoginResponse>("auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
    setToken(data.accessToken, data.csrfToken);
    return data.user;
  },

  /** Trekt ook de refresh token in op de backend, anders blijft die 30 dagen geldig. */
  async logout(): Promise<void> {
    const csrf = /(?:^|; )csrf_token=([^;]*)/.exec(document.cookie)?.[1];
    try {
      await fetch(`${API_BASE}auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "x-csrf-token": csrf ? decodeURIComponent(csrf) : "" },
      });
    } catch {
      /* offline: lokaal uitloggen volstaat */
    }
    clearToken();
  },

  isAuthenticated(): boolean {
    return !!getToken();
  },

  getToken,
};

export default AuthService;
