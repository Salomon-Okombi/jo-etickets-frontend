// src/app/providers/AuthProvider.tsx
import { createContext, useEffect, useState } from "react";
import api from "@/api/axiosClient";
import type { UserProfile } from "@/types/users";
import {
  initAuthFromStorage,
  clearStoredTokens,
} from "@/api/auth.api";

/* =========================================================
   TYPE DU CONTEXTE AUTH
========================================================= */

export interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;

  setUser: (user: UserProfile | null) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

/* =========================================================
   CONTEXTE
========================================================= */

export const AuthContext = createContext<AuthContextType | null>(null);

/* =========================================================
   PROVIDER
========================================================= */

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /* -------------------------
     Rafraîchir le profil
  -------------------------- */
  const refreshUser = async () => {
    const { data } = await api.get<UserProfile>("/utilisateurs/me/");
    setUser(data);
  };

  /* -------------------------
     Init auth au démarrage
  -------------------------- */
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      const tokens = initAuthFromStorage();

      if (!tokens) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const { data } = await api.get<UserProfile>("/utilisateurs/me/");
        if (mounted) {
          setUser(data);
        }
      } catch (err) {
        console.error("Erreur chargement profil :", err);
        clearStoredTokens();
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();
    return () => {
      mounted = false;
    };
  }, []);

  /* -------------------------
     Logout
  -------------------------- */
  const logout = () => {
    clearStoredTokens();
    setUser(null);
  };

  /* -------------------------
     Valeur exposée
  -------------------------- */
  const value: AuthContextType = {
    user,
    isAuthenticated: Boolean(user),
    loading,
    setUser,
    refreshUser,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;