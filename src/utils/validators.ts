/** Booléens simples */
export const isNonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
export const isPositiveInt = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v > 0;

/** Emails basiques */
export const isEmail = (v: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/** Mot de passe (min 8, 1 maj, 1 min, 1 chiffre) */
export const isStrongPassword = (v: string): boolean =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(v);

/** Username (alphanum + _ . - , 3..30) */
export const isUsername = (v: string): boolean =>
  /^[a-zA-Z0-9._-]{3,30}$/.test(v);

/** ISO date (YYYY-MM-DD) */
export const isISODate = (v: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(v);

/** ISO datetime approximatif */
export const isISODatetime = (v: string): boolean =>
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|([+-]\d{2}:\d{2}))?$/.test(v);

/** UUID v4 */
export const isUUIDv4 = (v: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

/** JWT (forme grossière) */
export const isJWT = (v: string): boolean =>
  /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(v);

/** Fabriqueurs */
export const minLength = (min: number) => (v: string) => v?.length >= min;
export const maxLength = (max: number) => (v: string) => v?.length <= max;
export const inRange = (min: number, max: number) => (n: number) => typeof n === "number" && n >= min && n <= max;

/** Combine plusieurs validateurs (ET logique) */
export function combine<T>(...validators: Array<(v: T) => boolean>) {
  return (v: T) => validators.every((fn) => fn(v));
}

/** Validation d’objet : renvoie un dictionnaire d’erreurs (clé -> message) */
export function validateObject<T extends Record<string, any>>(
  obj: T,
  rules: Partial<Record<keyof T, Array<{ test: (v: any) => boolean; message: string }>>>
): Partial<Record<keyof T, string>> {
  const errors: Partial<Record<keyof T, string>> = {};
  (Object.keys(rules) as Array<keyof T>).forEach((key) => {
    const tests = rules[key];
    if (!tests?.length) return;
    const value = obj[key];
    for (const { test, message } of tests) {
      if (!test(value)) {
        errors[key] = message;
        break;
      }
    }
  });
  return errors;
}
