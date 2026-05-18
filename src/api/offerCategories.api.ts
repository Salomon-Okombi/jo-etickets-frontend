// src/api/offerCategories.api.ts
import api from "@/api/axiosClient";

/**
 * Catégorie d'offre (template)
 * - code / nom
 * - nb_personnes = multiplicateur (1/2/4)
 * - auto_apply_all_events = globale (true) / spécifique (false)
 */
export type OfferCategory = {
  id: number;
  code: string;
  nom: string;
  description?: string | null;
  nb_personnes: number;
  cas_usage?: string | null;
  ordre_affichage: number;
  active: boolean;
  auto_apply_all_events: boolean;
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

function unwrap<T>(data: any): T[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

/* =========================================================
   PUBLIC
========================================================= */

export async function listOfferCategories(): Promise<OfferCategory[]> {
  const { data } = await api.get<OfferCategory[] | Paginated<OfferCategory>>(
    "/offres/categories/"
  );
  return unwrap<OfferCategory>(data);
}

/* =========================================================
   ADMIN (UTILISATION SIMPLE POUR SELECT/DROPDOWN)
   -> renvoie directement un tableau
========================================================= */

export async function listOfferCategoriesAdmin(): Promise<OfferCategory[]> {
  const { data } = await api.get<OfferCategory[] | Paginated<OfferCategory>>(
    "/offres/categories/admin/"
  );
  return unwrap<OfferCategory>(data);
}

/* =========================================================
   ADMIN (PAGINÉ) — optionnel si tu veux une vraie table paginée
========================================================= */

export async function listOfferCategoriesAdminPaginated(
  params?: Record<string, any>
): Promise<Paginated<OfferCategory>> {
  const { data } = await api.get<Paginated<OfferCategory>>(
    "/offres/categories/admin/",
    { params }
  );
  return data;
}

export async function getOfferCategoryAdmin(id: number): Promise<OfferCategory> {
  const { data } = await api.get<OfferCategory>(`/offres/categories/admin/${id}/`);
  return data;
}

export type OfferCategoryCreatePayload = {
  code: string;
  nom: string;
  description?: string | null;
  nb_personnes: number;
  cas_usage?: string | null;
  ordre_affichage?: number;
  active?: boolean;
  auto_apply_all_events?: boolean;
};

export type OfferCategoryUpdatePayload = Partial<OfferCategoryCreatePayload>;

export async function createOfferCategoryAdmin(
  payload: OfferCategoryCreatePayload
): Promise<OfferCategory> {
  const { data } = await api.post<OfferCategory>("/offres/categories/admin/", payload);
  return data;
}

export async function updateOfferCategoryAdmin(
  id: number,
  payload: OfferCategoryUpdatePayload
): Promise<OfferCategory> {
  const { data } = await api.patch<OfferCategory>(
    `/offres/categories/admin/${id}/`,
    payload
  );
  return data;
}

export async function deleteOfferCategoryAdmin(id: number): Promise<void> {
  await api.delete(`/offres/categories/admin/${id}/`);
}