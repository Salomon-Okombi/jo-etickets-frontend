import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

/**
 * ===========================================================
 * AXIOS CLIENT — JWT + Refresh automatique
 * ===========================================================
 */

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
   LocalStorage helpers
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

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 20000,
});

/* ------------------------------------------------------------------
   Refresh logic
------------------------------------------------------------------ */

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function notifyQueue(newAccess: string) {
  refreshQueue.forEach((cb) => cb(newAccess));
  refreshQueue = [];
}

async function refreshAccessToken(): Promise<string> {
  const tokens = getStoredTokens();
  if (!tokens?.refresh) {
    throw new Error("No refresh token");
  }

  const response = await axios.post<{ access: string }>(
    `${BASE_URL}${REFRESH_ENDPOINT}`,
    { refresh: tokens.refresh }
  );

  const updated: JwtPair = {
    access: response.data.access,
    refresh: tokens.refresh,
  };

  setStoredTokens(updated);
  return response.data.access;
}

/* ------------------------------------------------------------------
   Request interceptor
------------------------------------------------------------------ */

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokens = getStoredTokens();
    if (tokens?.access) {
      config.headers.Authorization = `Bearer ${tokens.access}`;
    }
    return config;
  }
);

/* ------------------------------------------------------------------
   Response interceptor (401 → refresh)
------------------------------------------------------------------ */

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

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
          setTimeout(() => reject(new Error("Refresh timeout")), 10000);
        });
      }

      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch (e) {
      isRefreshing = false;
      refreshQueue = [];
      clearStoredTokens();
      return Promise.reject(e);
    }
  }
);

export default api;