// src/types/offers.d.ts

export type OfferType = "SOLO" | "DUO" | "FAMILIALE" | string;
export type OfferStatus = "ACTIVE" | "INACTIVE" | "EPUISEE" | "EXPIREE" | string;

export interface Offer {
  id: number;
  evenement: number;
  evenement_nom?: string;

  nom_offre: string;
  description?: string | null;

  prix: number | string; // DRF Decimal souvent en string
  nb_personnes: number;

  type_offre: OfferType;

  stock_total: number;
  stock_disponible: number;

  date_debut_vente?: string;
  date_fin_vente?: string;

  statut: OfferStatus;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface OfferListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

export interface OfferCreatePayload {
  evenement: number;
  nom_offre: string;
  description?: string | null;

  prix: number;            // payload = number
  nb_personnes: number;
  type_offre: OfferType;

  stock_total: number;
  stock_disponible: number;

  date_debut_vente?: string;
  date_fin_vente?: string;

  statut: OfferStatus;
}

export type OfferUpdatePayload = Partial<OfferCreatePayload>;