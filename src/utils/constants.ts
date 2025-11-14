// Points d’entrée API / temps réel
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";

export const SSE_URL =
  import.meta.env.VITE_SSE_URL ?? `${API_BASE_URL.replace(/\/api$/, "")}/sse/`;

export const WS_URL =
  import.meta.env.VITE_WS_URL ?? `${API_BASE_URL.replace(/\/api$/, "")}/ws/`;

// Auth & stockage
export const TOKEN_STORAGE_KEY = "token";
export const REFRESH_TOKEN_STORAGE_KEY = "refresh_token";

// UI
export const DEFAULT_PAGE_SIZE = 20;
export const TOAST_DURATION_MS = 3500;

// Routes app (utile pour les <Link/> et guards)
export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  events: "/events",
  offers: "/offers",
  cart: "/cart",
  orders: "/orders",
  tickets: "/tickets",
  admin: {
    root: "/admin",
    events: "/admin/events",
    offers: "/admin/offers",
    users: "/admin/users",
    stats: "/admin/stats",
  },
} as const;

// Formats
export const DEFAULT_LOCALE = "fr-FR";
export const DEFAULT_CURRENCY = "EUR";
