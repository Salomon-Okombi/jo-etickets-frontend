import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

/* ===========================================================
   AXIOS CLIENT — VERSION DÉFINITIVE
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
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/* ===========================================================
    CORRECTION FINALE ICI
=========================================================== */

function isPublicEndpoint(url?: string): boolean {
  if (!url) return false;

  return (
    url.startsWith("/evenements") ||
    url.startsWith("/offres") ||
    url.startsWith("/api/evenements") ||
    url.startsWith("/api/offres")
  );
}

/* ===========================================================
   REFRESH TOKEN
=========================================================== */

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function notifyQueue(newToken: string) {
  refreshQueue.forEach((cb) => cb(newToken));
  refreshQueue = [];
}

async function refreshAccessToken(): Promise<string> {
  const tokens = getStoredTokens();
  if (!tokens?.refresh) throw new Error("No refresh token");

  const response = await axios.post<{ access: string }>(
    `${BASE_URL}${REFRESH_ENDPOINT}`,
    { refresh: tokens.refresh }
  );

  setStoredTokens({ access: response.data.access, refresh: tokens.refresh });
  return response.data.access;
}

/* ===========================================================
   REQUEST INTERCEPTOR
=========================================================== */

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokens = getStoredTokens();

    if (isPublicEndpoint(config.url)) {
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
   RESPONSE INTERCEPTOR — JWT REFRESH
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