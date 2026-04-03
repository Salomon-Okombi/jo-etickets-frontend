import type { User } from "@/types/auth";

function toBool(v: unknown): boolean {
  return v === true || v === 1 || v === "1";
}

export function normalizeUser(raw: User): User {
  return {
    ...raw,
    is_staff: toBool((raw as any).is_staff),
    is_superuser: toBool((raw as any).is_superuser),
  };
}