import api from "@/api/axiosClient";

export type OfferCategory = {
  id: number;
  code: string;
  nom: string;
  description?: string | null;
  nb_personnes: number;
  cas_usage?: string | null;
  ordre_affichage: number;
  active: boolean;
};

type Paginated<T> = {
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

export async function listOfferCategories(): Promise<OfferCategory[] | Paginated<OfferCategory>> {
  const { data } = await api.get<OfferCategory[] | Paginated<OfferCategory>>("/offres/categories/");
  return data;
}

// Optionnel: si tu préfères que la page reçoive TOUJOURS un array
export async function listOfferCategoriesArray(): Promise<OfferCategory[]> {
  const { data } = await api.get<OfferCategory[] | Paginated<OfferCategory>>("/offres/categories/");
  return unwrap<OfferCategory>(data);
}