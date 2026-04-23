//app/providers/AuthProvider.tsx
import { createContext, useEffect, useState } from "react";
import type { User } from "@/types/auth";
import {
  getProfile,
  initAuthFromStorage,
  clearStoredTokens,
} from "@/api/auth.api";
import { normalizeUser } from "@/utils/authNormalize";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      const tokens = initAuthFromStorage();

      if (!tokens) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const profile = await getProfile();
        if (mounted) {
          setUser(normalizeUser(profile as any));
        }
      } catch (err) {
        console.error("Erreur lors du chargement du profil :", err);
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;