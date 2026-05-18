// src/hooks/useAuth.ts
import { useContext } from "react";
import { AuthContext, type AuthContextType } from "@/app/providers/AuthProvider";

/**
 * Hook d'accès au contexte d'authentification
 * Typé explicitement pour TypeScript
 */
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }

  return ctx;
}

export default useAuth;