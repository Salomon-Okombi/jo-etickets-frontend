export function priceToCents(v: number | string | undefined | null): number {
  if (v === undefined || v === null) return 0;
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function centsToPrice(cents: number): number {
  return (Number(cents) || 0) / 100;
}

export function fmtMoneyFromCents(cents: number): string {
  return centsToPrice(cents).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}