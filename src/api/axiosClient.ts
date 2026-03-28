import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

/**
 * ===========================================================
 * AXIOS CLIENT — PUBLIC + AUTH (JWT) — PRODUCTION READY
 * ===========================================================
 * Pas d'Authorization pour les visiteurs
 * JWT ajouté uniquement si valide
 * Refresh automatique SimpleJWT
 * Queue anti double refresh
 * Compatible Django REST Framework + Render
 * ===========================================================
 */

/* ------------------------------------------------------------------
   Configuration
------------------------------------------------------------------ */

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  throw new Error("VITE_API_BASE_URL non définie");
}

const REFRESH_ENDPOINT = "/utilisateurs/token/refresh/";
const AUTH_STORAGE_KEY = "auth_tokens";

/* ------------------------------------------------------------------
   Types
------------------------------------------------------------------ */

export interface JwtPair {
  access: string;
  refresh: string;
}

/* ------------------------------------------------------------------
   Storage helpers
------------------------------------------------------------------ */

function getStoredTokens(): JwtPair | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.access === "string" &&
      typeof parsed?.refresh === "string"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function setStoredTokens(tokens: JwtPair) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
}

function clearStoredTokens() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("auth:logout"));
}

/* ------------------------------------------------------------------
   Axios instance
------------------------------------------------------------------ */

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/* ------------------------------------------------------------------
   Refresh logic (anti double refresh)
------------------------------------------------------------------ */

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function notifyQueue(newToken: string) {
  refreshQueue.forEach((cb) => cb(newToken));
  refreshQueue = [];
}

async function refreshAccessToken(): Promise<string> {
  const tokens = getStoredTokens();
  if (!tokens?.refresh) {
    throw new Error("No refresh token available");
  }

  const response = await axios.post<{ access: string }>(
    `${BASE_URL}${REFRESH_ENDPOINT}`,
    { refresh: tokens.refresh }
  );

  const updatedTokens: JwtPair = {
    access: response.data.access,
    refresh: tokens.refresh,
  };

  setStoredTokens(updatedTokens);
  return response.data.access;
}

/* ------------------------------------------------------------------
   REQUEST INTERCEPTOR
   Envoie Authorization UNIQUEMENT si token valide
------------------------------------------------------------------ */

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokens = getStoredTokens();

    if (tokens && typeof tokens.access === "string" && tokens.access.length > 0) {
      config.headers.Authorization = `Bearer ${tokens.access}`;
    } else {
      // CRITIQUE : ne jamais envoyer Authorization vide
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ------------------------------------------------------------------
   RESPONSE INTERCEPTOR
   401 → refresh automatique → retry
------------------------------------------------------------------ */

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      let newAccessToken: string;

      if (!isRefreshing) {
        isRefreshing = true;
        newAccessToken = await refreshAccessToken();
        isRefreshing = false;
        notifyQueue(newAccessToken);
      } else {
        newAccessToken = await new Promise<string>((resolve, reject) => {
          refreshQueue.push(resolve);
          setTimeout(
            () => reject(new Error("JWT refresh timeout")),
            10000
          );
        });
      }

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      refreshQueue = [];
      clearStoredTokens();
      return Promise.reject(refreshError);
    }
  }
);

export default api;