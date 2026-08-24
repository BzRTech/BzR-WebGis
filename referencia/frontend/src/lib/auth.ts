import { API_BASE, api, setAuthToken, setRefreshHandler } from "./api";
import type { Me } from "@/types/auth";

const ACCESS_KEY = "eixo.access";
const REFRESH_KEY = "eixo.refresh";

function base(): string {
  return API_BASE.replace(/\/$/, "");
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function storeTokens(access: string, refresh?: string): void {
  localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  setAuthToken(access);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  setAuthToken(null);
}

/** Restore a persisted session token on app start. */
export function loadStoredToken(): boolean {
  const access = localStorage.getItem(ACCESS_KEY);
  if (!access) return false;
  setAuthToken(access);
  return true;
}

export class LoginError extends Error {}

export async function login(
  username: string,
  password: string,
): Promise<void> {
  const res = await fetch(`${base()}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    throw new LoginError(
      res.status === 401
        ? "Usuário ou senha inválidos."
        : "Não foi possível entrar. Tente novamente.",
    );
  }
  const data = (await res.json()) as { access: string; refresh: string };
  storeTokens(data.access, data.refresh);
}

let refreshing: Promise<boolean> | null = null;

export function refreshSession(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) return false;
    try {
      const res = await fetch(`${base()}/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) {
        clearTokens();
        return false;
      }
      const data = (await res.json()) as { access: string; refresh?: string };
      storeTokens(data.access, data.refresh);
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

setRefreshHandler(refreshSession);

export async function fetchMe(): Promise<Me> {
  return api.get("auth/me/").json<Me>();
}

export async function logout(): Promise<void> {
  const refresh = getRefreshToken();
  if (refresh) {
    try {
      await api.post("auth/logout/", { json: { refresh } });
    } catch {
      // Best-effort; tokens are cleared regardless.
    }
  }
  clearTokens();
}
