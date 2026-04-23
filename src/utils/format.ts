import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from "./constants";

/** Nombre → prix (EUR par défaut) */
export function formatPrice(
  value: number | string,
  locale: string = DEFAULT_LOCALE,
  currency: string = DEFAULT_CURRENCY
): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(n);
}

/** Alias explicite pour l’euro */
export const formatEuro = (v: number | string, locale?: string) =>
  formatPrice(v, locale, "EUR");

/** 0.1234 -> 12,34 % */
export function formatPercent(
  ratio: number,
  locale: string = DEFAULT_LOCALE,
  digits: { min?: number; max?: number } = { min: 0, max: 2 }
): string {
  if (!Number.isFinite(ratio)) return "—";
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: digits.min ?? 0,
    maximumFractionDigits: digits.max ?? 2,
  }).format(ratio);
}

/** Date ISO -> 31/10/2025 */
export function formatDate(iso?: string | null, locale: string = DEFAULT_LOCALE): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale).format(d);
}

/** Datetime ISO -> 31/10/2025 14:32 */
export function formatDateTime(iso?: string | null, locale: string = DEFAULT_LOCALE): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

/** Tronquer une chaîne proprement */
export function truncate(text: string, max = 120): string {
  if (!text) return "";
  return text.length <= max
    ? text
    : `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

/** Pluriel simple FR (ex: "1 billet", "2 billets") */
export function pluralize(n: number, singular: string, plural?: string): string {
  return `${n} ${n > 1 ? plural ?? `${singular}s` : singular}`;
}

/** Conversion string -> number sécurisée */
export function safeToNumber(v: string | number | null | undefined, fallback = 0): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

/** Parse simple (ex: "1 234,56") -> 1234.56 */
export function parseNumber(input: string): number | null {
  if (!input) return null;
  const normalized = input.replace(/\s| /g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

/* ------------------------------------------------------------------
   Aliases pour compatibilité
------------------------------------------------------------------ */

/** Alias de formatPrice (nom attendu dans StatsPage et ailleurs) */
export const formatCurrency = formatPrice;

/** Formate un nombre brut avec séparateur de milliers */
export function formatNumber(value: number | string, locale: string = DEFAULT_LOCALE): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(locale).format(n);
}