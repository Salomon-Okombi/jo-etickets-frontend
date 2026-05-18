// src/types/evenements.ts

/* =========================
   Statut BACKEND (API)
========================= */

export type EventBackendStatus = "BROUILLON" | "PUBLIE" | "ARCHIVE";

/* =========================
   Modèle Evenement (API)
========================= */

export interface Evenement {
  id: number;

  nom_evenement: string;
  discipline?: string;
  lieu: string;

  date_debut: string; // ISO datetime
  date_fin: string;   // ISO datetime

  description_courte?: string;
  description_longue?: string;

  image_url?: string | null;

  prix_base: string;
  statut: EventBackendStatus;

  date_creation?: string;
}

/* =========================
   Pagination DRF
========================= */

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/* =========================
   Paramètres liste
========================= */

export interface EvenementListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

/* =========================
   Helpers UI (FRONTEND UNIQUEMENT)
    PAS envoyés au backend
========================= */

export type EventUIStatus = "A_VENIR" | "EN_COURS" | "TERMINE";

/**
 * Déduit le statut UI à partir des dates backend
 */
export function computeEventUIStatus(
  date_debut: string,
  date_fin: string
): EventUIStatus {
  const now = new Date();
  const debut = new Date(date_debut);
  const fin = new Date(date_fin);

  if (now < debut) return "A_VENIR";
  if (now > fin) return "TERMINE";
  return "EN_COURS";
}
