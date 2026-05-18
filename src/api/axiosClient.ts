// src/api/axiosClient.ts
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

/* ===========================================================
   CONFIG
=========================================================== */

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  throw new Error("VITE_API_BASE_URL non définie");
}

const AUTH_STORAGE_KEY = "auth_tokens";
const REFRESH_ENDPOINT = "/utilisateurs/token/refresh/";

export interface JwtPair {
  access: string;
  refresh: string;
}

/* ===========================================================
   STORAGE
=========================================================== */

function getStoredTokens(): JwtPair | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (parsed?.access && parsed?.refresh) return parsed;
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
  baseURL: BASE_URL, // ex: http://127.0.0.1:8000/api
  timeout: 20000,
  headers: {
    Accept: "application/json",
  },
});

/* ===========================================================
   REFRESH TOKEN (ANTI BOUCLE)
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
    throw new Error("No refresh token");
  }

  // Important: on utilise la même instance axios,
  // mais ça ne pose pas de problème car on contrôle la logique 401 ci-dessous.
  const response = await api.post<{ access: string }>(REFRESH_ENDPOINT, {
    refresh: tokens.refresh,
  });

  setStoredTokens({
    access: response.data.access,
    refresh: tokens.refresh,
  });

  return response.data.access;
}

/* ===========================================================
   REQUEST INTERCEPTOR
   - On attache le JWT si on en a un
   - On ne le retire jamais pour les endpoints publics (ça évite de casser l’admin)
=========================================================== */

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokens = getStoredTokens();

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
   RESPONSE INTERCEPTOR — JWT REFRESH
   - On refresh uniquement si :
     - 401
     - pas déjà retry
     - on a un refresh token
     - ce n’est pas l’endpoint de refresh lui-même
=========================================================== */

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest =
      error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    // Si on n'a pas de requête originale ou pas de 401 → on sort
    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Ne pas tenter de refresh sur l’endpoint de refresh
    if (originalRequest.url?.startsWith(REFRESH_ENDPOINT)) {
      clearStoredTokens();
      return Promise.reject(error);
    }

    // Si déjà retry → stop
    if (originalRequest._retry) {
      clearStoredTokens();
      return Promise.reject(error);
    }

    const tokens = getStoredTokens();
    if (!tokens?.refresh) {
      clearStoredTokens();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      let newAccess: string;

      if (!isRefreshing) {
        isRefreshing = true;
        newAccess = await refreshAccessToken();
        isRefreshing = false;
        notifyQueue(newAccess);
      } else {
        newAccess = await new Promise<string>((resolve, reject) => {
          refreshQueue.push(resolve);
          setTimeout(() => reject(new Error("JWT refresh timeout")), 10000);
        });
      }

      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (e) {
      isRefreshing = false;
      refreshQueue = [];
      clearStoredTokens();
      return Promise.reject(e);
    }
  }
);

export default api;