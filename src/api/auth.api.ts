// src/api/auth.api.ts
import api from "@/api/axiosClient";
import type { User } from "@/types/auth";

export interface JwtPair {
  access: string;
  refresh: string;
}

// 🔑 Login → renvoie { access, refresh }
export async function loginUser(
  username: string,
  password: string
): Promise<JwtPair> {
  const { data } = await api.post<JwtPair>("/utilisateurs/token/", {
    username,
    password,
  });
  return data;
}

// 📝 Register → renvoie (en général) l'utilisateur créé
export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export async function registerUser(payload: RegisterPayload): Promise<User> {
  const { data } = await api.post<User>("/utilisateurs/inscription/", payload);
  return data;
}

// 👤 Profil courant
export async function getProfile(): Promise<User> {
  const { data } = await api.get<User>("/utilisateurs/profil/");
  return data;
}
