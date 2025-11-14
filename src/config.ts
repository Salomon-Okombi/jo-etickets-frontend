/**
 * ===========================================================
 * ⚙️ CONFIGURATION GLOBALE DE L’APPLICATION
 * -----------------------------------------------------------
 * - Centralise toutes les constantes configurables
 * - Récupère les variables d’environnement Vite
 * - Fournit un typage complet pour éviter les erreurs
 * ===========================================================
 */

/* ------------------------------------------------------------------
   🌐 API & BACKEND
------------------------------------------------------------------ */

/**
 * URL racine de l’API backend Django.
 * Doit pointer vers ton endpoint `/api/`.
 */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";

/**
 * URL WebSocket pour la communication en temps réel.
 * Exemple : ws://127.0.0.1:8000/ws/ ou wss://tonsite.com/ws/
 */
export const WS_URL: string =
  import.meta.env.VITE_WS_URL ?? `${API_BASE_URL.replace(/\/api$/, "")}/ws/`;

/**
 * URL SSE (Server-Sent Events), si utilisée pour les flux en lecture seule.
 */
export const SSE_URL: string =
  import.meta.env.VITE_SSE_URL ?? `${API_BASE_URL.replace(/\/api$/, "")}/sse/`;

/* ------------------------------------------------------------------
   🔐 AUTHENTIFICATION
------------------------------------------------------------------ */

/** Clé pour stocker le token JWT dans localStorage */
export const TOKEN_STORAGE_KEY = "token";

/** Clé pour le refresh token (si utilisée) */
export const REFRESH_TOKEN_STORAGE_KEY = "refresh_token";

/** Durée de validité d’une session locale (en ms) */
export const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24h

/* ------------------------------------------------------------------
   💅 INTERFACE UTILISATEUR
------------------------------------------------------------------ */

/** Taille par défaut de la pagination */
export const DEFAULT_PAGE_SIZE = 20;

/** Durée d’affichage d’un toast (en ms) */
export const TOAST_DURATION_MS = 3500;

/** Thème par défaut */
export const DEFAULT_THEME = "light";

/** Liste des thèmes supportés (daisyUI) */
export const THEMES = ["light", "dark", "cupcake", "corporate", "emerald"] as const;
export type Theme = (typeof THEMES)[number];

/* ------------------------------------------------------------------
   💶 FORMATAGE & LOCALE
------------------------------------------------------------------ */
export const DEFAULT_LOCALE = "fr-FR";
export const DEFAULT_CURRENCY = "EUR";

/* ------------------------------------------------------------------
   🧭 ROUTES FRONT
------------------------------------------------------------------ */
export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  events: "/events",
  offers: "/offers",
  cart: "/cart",
  orders: "/orders",
  tickets: "/tickets",
  profile: "/profile",
  admin: {
    root: "/admin",
    events: "/admin/events",
    offers: "/admin/offers",
    users: "/admin/users",
    stats: "/admin/stats",
  },
} as const;

/* ------------------------------------------------------------------
   🧠 MÉTADONNÉES APP
------------------------------------------------------------------ */
export const APP_NAME = import.meta.env.VITE_APP_NAME ?? "JO eTicket";
export const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? "1.0.0";
export const APP_DESCRIPTION =
  import.meta.env.VITE_APP_DESCRIPTION ??
  "Application de gestion de billets électroniques pour les Jeux Olympiques.";

/* ------------------------------------------------------------------
   ✅ OBJET DE CONFIGURATION CENTRALISÉ
------------------------------------------------------------------ */
export const config = {
  app: {
    name: APP_NAME,
    version: APP_VERSION,
    description: APP_DESCRIPTION,
  },
  api: {
    baseURL: API_BASE_URL,
    wsURL: WS_URL,
    sseURL: SSE_URL,
  },
  auth: {
    tokenKey: TOKEN_STORAGE_KEY,
    refreshTokenKey: REFRESH_TOKEN_STORAGE_KEY,
    sessionTimeout: SESSION_TIMEOUT_MS,
  },
  ui: {
    defaultTheme: DEFAULT_THEME,
    supportedThemes: THEMES,
    pageSize: DEFAULT_PAGE_SIZE,
    toastDuration: TOAST_DURATION_MS,
  },
  locale: {
    default: DEFAULT_LOCALE,
    currency: DEFAULT_CURRENCY,
  },
  routes: ROUTES,
} as const;

export default config;
