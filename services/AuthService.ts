import { apiFetch, getToken, setToken, clearToken } from "@/lib/api";

interface LoginResponse {
  accessToken: string;
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
    setToken(data.accessToken);
    return data.user;
  },

  logout(): void {
    clearToken();
  },

  isAuthenticated(): boolean {
    return !!getToken();
  },

  getToken,
};

export default AuthService;
