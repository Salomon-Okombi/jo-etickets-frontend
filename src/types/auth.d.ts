// src/types/auth.d.ts

export interface Tokens {
  access: string;
  refresh?: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

/**
 * Représente un utilisateur côté frontend.
 * Doit être compatible avec ce que renvoie /utilisateurs/me/
 */
export interface User {
  id: number;
  username: string;
  email: string;

  // Champs renvoyés par ton backend (via UtilisateurSerializer)
  type_compte?: "CLIENT" | "ADMIN" | "VALIDATEUR";
  statut?: "ACTIF" | "INACTIF" | "SUSPENDU";
  date_creation?: string;

  // Champs possibles si tu les exposes dans le serializer
  is_staff?: boolean;
  is_superuser?: boolean;
}

/** Alias sémantique : le profil courant = un User */
export interface Profile extends User {}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
