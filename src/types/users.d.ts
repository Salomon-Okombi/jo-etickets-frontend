// src/types/users.d.ts

export type AccountType = "CLIENT" | "ADMIN" | string;
export type AccountStatus = "ACTIF" | "INACTIF" | string;

/**
 * DTO utilisateur (aligné sur UtilisateurSerializer côté backend)
 * fields = ["id", "username", "email", "type_compte", "statut", "date_creation"]
 */
export interface User {
  id: number;
  username: string;
  email: string;
  type_compte?: AccountType;
  statut?: AccountStatus;
  date_creation?: string;
  
}

/**
 * Pagination DRF standard
 */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Params de liste pour DRF
 */
export interface UserListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

/**
 * Payload d'inscription (UtilisateurRegisterSerializer)
 */
export interface UserRegisterPayload {
  username: string;
  email: string;
  password: string;
  type_compte?: AccountType;
}

/**
 * Payload de mise à jour (si ton backend permet PATCH/PUT)
 * On ne met que les champs "safe" côté admin.
 */
export interface UserUpdatePayload {
  username?: string;
  email?: string;
  type_compte?: AccountType;
  statut?: AccountStatus;
}