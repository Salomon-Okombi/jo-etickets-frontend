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

export async function listOfferCategories(): Promise<OfferCategory[]> {
  const { data } = await api.get<OfferCategory[]>("/offres/categories/");
  return data;
}