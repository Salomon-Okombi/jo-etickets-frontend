import React, { createContext, useEffect, useState } from "react";
import type { User } from "@/types/auth";
import {
  getProfile,
  initAuthFromStorage,
  clearStoredTokens,
} from "@/api/auth.api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

//  Export nommé du contexte
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

//  Export par défaut du provider
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Au démarrage : relire les tokens + éventuellement charger le profil
  useEffect(() => {
    const tokens = initAuthFromStorage();
    if (!tokens) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const profile = await getProfile();
        setUser(profile);
      } catch (err) {
        console.error("Erreur lors du chargement du profil :", err);
        clearStoredTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const logout = () => {
    clearStoredTokens();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    setUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
