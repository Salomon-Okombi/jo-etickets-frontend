
//src/types/events.d.ts
export type EventStatus = "BROUILLON" | "PUBLIE" | "ARCHIVE";

/* =========================================================
   Modèle Event (API publique + admin)
========================================================= */

export interface Event {
  id: number;

  nom_evenement: string;
  discipline: string;
  lieu: string;

  date_evenement: string;          // ISO : "YYYY-MM-DD"
  heure_evenement?: string | null; // optionnel

  description_courte: string;
  description_longue: string;

  image_url: string;

  statut: EventStatus;

  date_creation?: string;          // ISO datetime
}

/* =========================================================
   Pagination générique DRF
========================================================= */

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/* =========================================================
   Paramètres liste événements
========================================================= */

export interface EventListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

/* =========================================================
   Payloads admin
========================================================= */

// Création (admin)
export type EventCreatePayload = {
  nom_evenement: string;
  discipline: string;
  lieu: string;
  date_evenement: string;
  heure_evenement?: string | null;
  description_courte: string;
  description_longue: string;
  statut: EventStatus;
};

// Mise à jour partielle (admin)
export type EventUpdatePayload = Partial<EventCreatePayload>;