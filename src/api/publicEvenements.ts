import  api  from "@/utils/http";
import type { PublicEvenementDetail, PublicEvenementListItem } from "@/types/evenements";

export async function fetchPublicEvenements(signal?: AbortSignal) {
  const res = await api.get<PublicEvenementListItem[]>("/evenements/public/", { signal });
  return res.data;
}

export async function fetchPublicEvenement(slug: string, signal?: AbortSignal) {
  const res = await api.get<PublicEvenementDetail>(`/evenements/public/${slug}/`, { signal });
  return res.data;
}