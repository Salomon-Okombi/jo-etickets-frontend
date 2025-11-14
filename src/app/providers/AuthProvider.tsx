// src/app/providers/AuthProvider.tsx
import React, {
  useEffect,
  useState,
  type ReactNode,
  useCallback,
} from "react";
import { getProfile, loginUser, registerUser } from "@/api/auth.api";
import { AuthContext, type AuthContextType } from "./AuthContext";

interface StoredTokens {
  access: string;
  refresh: string;
}

const STORAGE_KEY = "auth_tokens";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const readStoredTokens = (): StoredTokens | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoredTokens;
      if (parsed?.access && parsed?.refresh) return parsed;
      return null;
    } catch {
      return null;
    }
  };

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await getProfile();
      setUser(profile);
    } catch {
      // si le profil échoue, on se considère déconnecté
      setUser(null);
      setToken(null);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = readStoredTokens();
    if (stored?.access) {
      setToken(stored.access);
      void refreshProfile();
    } else {
      setLoading(false);
    }

    // synchro avec axiosClient → évènements "auth:logout"
    const onLogout = () => {
      setUser(null);
      setToken(null);
      setLoading(false);
    };
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, [refreshProfile]);

  async function login(username: string, password: string) {
    setLoading(true);
    try {
      const tokens = await loginUser(username, password);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
      setToken(tokens.access);
      await refreshProfile();
    } finally {
      setLoading(false);
    }
  }

  async function register(username: string, email: string, password: string) {
    setLoading(true);
    try {
      await registerUser({ username, email, password });
      await login(username, password);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("auth:logout"));
  }

  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
