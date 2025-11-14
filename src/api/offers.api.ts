// src/api/offers.api.ts
import { api } from "./axiosClient";

/* ------------------------------------------------------------------
   Types alignés sur le backend Django
------------------------------------------------------------------ */

export type OfferStatus = "DISPONIBLE" | "INDISPONIBLE" | "EPUISEE";

export interface Offer {
  id: number;
  evenement: number;                 // id de l'événement
  nom_offre: string;
  description: string | null;
  prix: number | string;             // DRF renvoie souvent des décimaux en string
  nb_personnes: number | null;
  type_offre: string;
  stock_total: number;
  stock_disponible: number;
  date_debut_vente: string | null;   // ✅ peut être null
  date_fin_vente: string | null;     // ✅ peut être null
  statut: OfferStatus;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Payload pour la création d’une offre.
 * On garde les dates en `string | null` pour matcher
 * ce que tu envoies depuis le formulaire (ISO ou null).
 */
export interface CreateOfferPayload {
  evenement: number;
  nom_offre: string;
  description?: string | null;
  prix: number;
  nb_personnes: number;
  type_offre: string;
  stock_total: number;
  stock_disponible: number;
  date_debut_vente: string | null;
  date_fin_vente: string | null;
  statut: OfferStatus;
}

/**
 * Pour la mise à jour, tout est optionnel.
 */
export type UpdateOfferPayload = Partial<CreateOfferPayload>;

/* ------------------------------------------------------------------
   Endpoints /offres/
------------------------------------------------------------------ */

export async function listOffers(params?: {
  page?: number;
  search?: string;
  ordering?: string;
}): Promise<Paginated<Offer>> {
  const { data } = await api.get<Paginated<Offer>>("/offres/", { params });
  return data;
}

export async function getOffer(id: number): Promise<Offer> {
  const { data } = await api.get<Offer>(`/offres/${id}/`);
  return data;
}

export async function createOffer(payload: CreateOfferPayload): Promise<Offer> {
  const { data } = await api.post<Offer>("/offres/", payload);
  return data;
}

export async function updateOffer(
  id: number,
  payload: UpdateOfferPayload
): Promise<Offer> {
  const { data } = await api.patch<Offer>(`/offres/${id}/`, payload);
  return data;
}

export async function deleteOffer(id: number): Promise<void> {
  await api.delete(`/offres/${id}/`);
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type PaginatedOffers = Paginated<Offer>;
