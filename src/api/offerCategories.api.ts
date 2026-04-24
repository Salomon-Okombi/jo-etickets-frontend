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


export async function listOfferCategories(): Promise<OfferCategory[]> {
  const { data } = await api.get<OfferCategory[] | Paginated<OfferCategory>>(
    "/offres/categories/"
  );
  return unwrap<OfferCategory>(data);
}