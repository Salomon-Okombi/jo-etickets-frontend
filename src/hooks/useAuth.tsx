// src/hooks/useAuth.ts
import { useContext } from "react";
import { AuthContext } from "@/app/providers/AuthProvider";

// Je fournis un export nommé pour autoriser: import { useAuth } from "@/hooks/useAuth"
export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }

  return ctx;
}

export default useAuth;