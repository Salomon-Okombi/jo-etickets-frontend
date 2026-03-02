// src/utils/authNormalize.ts
import type { User } from "@/types/auth";

function toBool(v: unknown): boolean {
  // Je convertis 1/"1"/true -> true et 0/"0"/false/undefined -> false
  return v === true || v === 1 || v === "1";
}

export function normalizeUser(raw: User): User {
  // Je sécurise les flags admin car l'API peut renvoyer 0/1
  return {
    ...raw,
    is_staff: toBool((raw as any).is_staff),
    is_superuser: toBool((raw as any).is_superuser),
  };
}