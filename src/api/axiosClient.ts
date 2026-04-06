import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

/* ===========================================================
   AXIOS CLIENT — PUBLIC + AUTH (JWT)
   ===========================================================
   - Pas d'Authorization pour les endpoints publics
   - JWT UNIQUEMENT pour endpoints protégés
   - Refresh automatique avec file d’attente
   - Compatible DRF + SimpleJWT + Render
=========================================================== */

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  throw new Error("VITE_API_BASE_URL non définie");
}

/* ===========================================================
   CONSTANTES
=========================================================== */

const AUTH_STORAGE_KEY = "auth_tokens";
const REFRESH_ENDPOINT = "/utilisateurs/token/refresh/";

/* ===========================================================
   TYPES
=========================================================== */

export interface JwtPair {
  access: string;
  refresh: string;
}

/* ===========================================================
   HELPERS LOCAL STORAGE
=========================================================== */

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

/* ===========================================================
   AXIOS INSTANCE
=========================================================== */

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/* ===========================================================
   ENDPOINTS PUBLICS (CRITIQUE)
   -> AUCUN JWT DOIT ÊTRE ENVOYÉ ICI
=========================================================== */

function isPublicEndpoint(url?: string): boolean {
  if (!url) return false;

  return (
    url.startsWith("/evenements") ||
    url.startsWith("/offres")
  );
}

/* ===========================================================
   REFRESH TOKEN — ANTI DOUBLE REFRESH
=========================================================== */

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function notifyQueue(newToken: string) {
  refreshQueue.forEach((cb) => cb(newToken));
  refreshQueue = [];
}

async function refreshAccessToken(): Promise<string> {
  const tokens = getStoredTokens();
  if (!tokens?.refresh) {
    throw new Error("Aucun refresh token disponible");
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

/* ===========================================================
   REQUEST INTERCEPTOR
=========================================================== */

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokens = getStoredTokens();

    if (isPublicEndpoint(config.url)) {
      // ✅ TRÈS IMPORTANT : jamais de JWT sur endpoints publics
      delete config.headers.Authorization;
      return config;
    }

    if (tokens?.access) {
      config.headers.Authorization = `Bearer ${tokens.access}`;
    } else {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ===========================================================
   RESPONSE INTERCEPTOR — REFRESH JWT
=========================================================== */

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isPublicEndpoint(originalRequest.url)
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