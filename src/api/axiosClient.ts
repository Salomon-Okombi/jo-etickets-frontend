// src/api/axiosClient.ts
import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

/**
 * ===========================================================
 * 🌐 AXIOS CLIENT — Gestion JWT + Refresh automatique
 * ===========================================================
 * - Injecte le token JWT dans chaque requête
 * - Rafraîchit automatiquement le token expiré (401)
 * - Synchronise le stockage local
 * ===========================================================
 */

/* ------------------------------------------------------------------
   ⚙️ CONFIGURATION DE BASE
------------------------------------------------------------------ */

/**
 * Base URL de l'API backend Django.
 * Exemple dans ton .env :
 * VITE_API_URL=http://127.0.0.1:8000/api
 */
const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api").replace(
  /\/+$/,
  ""
);

/** Endpoint de refresh JWT (adaptable si besoin) */
const REFRESH_ENDPOINT =
  import.meta.env.VITE_JWT_REFRESH_URL ?? "/token/refresh/";

/** Clé utilisée dans localStorage pour stocker les tokens JWT */
const AUTH_STORAGE_KEY = "auth_tokens";

/* ------------------------------------------------------------------
   🔐 Types et gestion du stockage
------------------------------------------------------------------ */

export interface JwtPair {
  access: string;
  refresh: string;
}

/** Récupère les tokens du localStorage (ou null si absent) */
function getStoredTokens(): JwtPair | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.access === "string" &&
      typeof parsed.refresh === "string"
    ) {
      return parsed as JwtPair;
    }
    return null;
  } catch {
    return null;
  }
}

/** Sauvegarde les tokens */
function setStoredTokens(tokens: JwtPair) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
}

/** Supprime les tokens et déclenche un event de logout */
function clearStoredTokens() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("auth:logout"));
}

/* ------------------------------------------------------------------
   ⚙️ Instance Axios principale
------------------------------------------------------------------ */

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  // Si tu utilises des cookies côté Django + CORS_ALLOW_CREDENTIALS=True :
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 20000,
});

/* ------------------------------------------------------------------
   ♻️ Rafraîchissement du token
------------------------------------------------------------------ */

let isRefreshing = false;
let refreshWaiters: Array<(token: string) => void> = [];

/** Notifie toutes les requêtes en attente après un refresh réussi */
function notifyWaiters(newAccess: string) {
  refreshWaiters.forEach((resolve) => resolve(newAccess));
  refreshWaiters = [];
}

/** Rafraîchit le token access en utilisant le refresh token */
async function refreshAccessToken(): Promise<string> {
  const current = getStoredTokens();
  if (!current?.refresh) throw new Error("No refresh token available");

  // Client sans interceptors pour éviter boucle
  const bare = axios.create({ baseURL: BASE_URL });

  const { data } = await bare.post<{ access: string }>(REFRESH_ENDPOINT, {
    refresh: current.refresh,
  });

  const updated: JwtPair = { access: data.access, refresh: current.refresh };
  setStoredTokens(updated);
  return data.access;
}

/* ------------------------------------------------------------------
   🚀 Interceptor de requêtes
   → Ajoute le token JWT si présent
------------------------------------------------------------------ */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const tokens = getStoredTokens();
  if (tokens?.access) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>)["Authorization"] =
      `Bearer ${tokens.access}`;
  }
  return config;
});

/* ------------------------------------------------------------------
   ⚠️ Interceptor de réponses
   → Si 401 : tente un refresh automatique du token
------------------------------------------------------------------ */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;

    // Pas de retry si :
    // - pas de config
    // - status != 401
    // - requête déjà retentée
    if (!original || status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      let newAccess: string;

      if (!isRefreshing) {
        isRefreshing = true;
        newAccess = await refreshAccessToken();
        isRefreshing = false;
        notifyWaiters(newAccess);
      } else {
        // On attend la fin du refresh en cours
        newAccess = await new Promise<string>((resolve, reject) => {
          refreshWaiters.push(resolve);
          setTimeout(() => reject(new Error("Refresh timeout")), 10000);
        });
      }

      // Rejoue la requête initiale avec le nouveau token
      original.headers = original.headers ?? {};
      (original.headers as Record<string, string>)["Authorization"] =
        `Bearer ${newAccess}`;

      return api(original);
    } catch (err) {
      // Refresh échoué → déconnexion
      isRefreshing = false;
      refreshWaiters = [];
      clearStoredTokens();
      return Promise.reject(err);
    }
  }
);

export default api;
