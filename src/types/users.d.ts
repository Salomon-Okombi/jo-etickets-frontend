// src/types/users.d.ts

/* =========================================================
   TYPES MÉTIERS
========================================================= */

export type AccountType =
  | "ADMIN"
  | "ORGANISATEUR"
  | "UTILISATEUR";

/* =========================================================
   UTILISATEUR – LISTES / ADMIN
   (CRUD admin, tableaux, recherches)
========================================================= */

export interface User {
  id: number;
  username: string;
  email: string;

  role?: AccountType;
  est_bloque?: boolean;
  est_verifie?: boolean;

  date_creation?: string;
}

/* =========================================================
   PROFIL UTILISATEUR CONNECTÉ
   /api/utilisateurs/me/
    utilisé dans useAuth / MainHeader / ProfilePage
========================================================= */

export interface UserProfile {
  id: number;
  username: string;
  email: string;

  first_name: string | null;
  last_name: string | null;
  telephone?: string | null;

  role: AccountType;
  est_verifie: boolean;
  est_bloque: boolean;

  photo_profil_url?: string | null;

  date_creation?: string;
}

/* =========================================================
   PAGINATION DRF
========================================================= */

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/* =========================================================
   PARAMÈTRES LISTE ADMIN USERS
========================================================= */

export interface UserListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  role?: AccountType;
  est_bloque?: boolean;
}

/* =========================================================
   PAYLOADS
========================================================= */

export interface UserRegisterPayload {
  username: string;
  email: string;
  password: string;
  role?: AccountType;
  est_bloque?: boolean;
}

export interface UserUpdatePayload {
  username?: string;
  email?: string;
  role?: AccountType;
  est_bloque?: boolean;
  password?: string;
}