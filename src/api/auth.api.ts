// src/api/auth.api.ts
import api from "@/api/axiosClient";
import type { User } from "@/types/auth";

export interface JwtPair {
  access: string;
  refresh: string;
}

export type AccountType = "CLIENT" | "ADMIN" | "ADMINISTRATEUR" | "UTILISATEUR";

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  role: AccountType;
}

// Je garde la même clé que axiosClient.ts (AUTH_STORAGE_KEY = "auth_tokens")
export const AUTH_STORAGE_KEY = "auth_tokens";

/* -----------------------------
   Auth endpoints
------------------------------ */

// Je récupère access/refresh
export async function loginUser(username: string, password: string): Promise<JwtPair> {
  const { data } = await api.post<JwtPair>("/utilisateurs/token/", { username, password });
  return data;
}

// Je crée un compte
export async function registerUser(payload: RegisterPayload): Promise<User> {
  const { data } = await api.post<User>("/utilisateurs/register/", payload);
  return data;
}

// Je récupère le profil connecté
export async function getProfile(): Promise<User> {
  const { data } = await api.get<User>("/utilisateurs/me/");
  return data;
}

/* -----------------------------
   Token storage helpers
------------------------------ */

// Je stocke les tokens sous la forme attendue par axiosClient.ts
export function storeTokens(tokens: JwtPair) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
}

// Je relis les tokens depuis localStorage
export function getStoredTokens(): JwtPair | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.access === "string" && typeof parsed?.refresh === "string") {
      return parsed as JwtPair;
    }
    return null;
  } catch {
    return null;
  }
}

// Je supprime les tokens
export function clearStoredTokens() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

/**
 * Je l’utilise au démarrage (AuthProvider) pour :
 * - vérifier si des tokens existent déjà
 * - laisser axiosClient.ts injecter Authorization via son interceptor
 */
export function initAuthFromStorage(): JwtPair | null {
  return getStoredTokens();
}