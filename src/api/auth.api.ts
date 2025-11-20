// src/api/auth.api.ts
import api from "@/api/axiosClient";
import type { User } from "@/types/auth";

export interface JwtPair {
  access: string;
  refresh: string;
}

export type AccountType = "CLIENT" | "ADMIN";

// 🔐 Clés de stockage local
export const ACCESS_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";

// 🔑 Login → renvoie { access, refresh }
export async function loginUser(
  username: string,
  password: string
): Promise<JwtPair> {
  const { data } = await api.post<JwtPair>("/utilisateurs/token/", {
    username,
    password,
  });
  return data;
}

// 📝 Register → renvoie (en général) l'utilisateur créé
export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  type_compte: AccountType;
}

export async function registerUser(payload: RegisterPayload): Promise<User> {
  // ✅ URL alignée sur la collection Postman
  const { data } = await api.post<User>("/utilisateurs/register/", payload);
  return data;
}

// 👤 Profil courant
export async function getProfile(): Promise<User> {
  // ✅ URL alignée sur "Mon Profil (GET)" dans Postman
  const { data } = await api.get<User>("/utilisateurs/me/");
  return data;
}

/* ------------------------------------------------------------------
   Helpers de gestion des tokens + header Authorization
------------------------------------------------------------------ */

export function storeTokens(tokens: JwtPair) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  api.defaults.headers.common["Authorization"] = `Bearer ${tokens.access}`;
}

export function getStoredTokens(): JwtPair | null {
  const access = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!access || !refresh) return null;
  return { access, refresh };
}

export function clearStoredTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  delete api.defaults.headers.common["Authorization"];
}

/**
 * À appeler au démarrage de l’app (dans l’AuthProvider) pour :
 * - relire les tokens en localStorage
 * - reposer le header Authorization si possible
 */
export function initAuthFromStorage(): JwtPair | null {
  const tokens = getStoredTokens();
  if (tokens?.access) {
    api.defaults.headers.common["Authorization"] = `Bearer ${tokens.access}`;
  }
  return tokens;
}
