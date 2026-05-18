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
  discipline?: string | null;
  lieu: string;

  date_debut: string;
  date_fin: string;

  description_courte?: string;
  description_longue?: string;

  image_url?: string | null;

  prix_base: string;

  // présent en admin mais pas toujours en public
  statut?: EventBackendStatus;

  date_creation?: string;
}

/* =========================
   TYPES PUBLIC 
========================= */

export type PublicEvenementListItem = Evenement;
export type PublicEvenementDetail = Evenement;

// placeholder si besoin côté front
export type PublicOffre = any;

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
   Helpers UI
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