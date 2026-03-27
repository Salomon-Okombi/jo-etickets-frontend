import  api  from "./axiosClient";
import type { Offer } from "@/types/offers";

export async function listPublicOffers(params?: { evenement?: number }) {
  const { data } = await api.get<Offer[]>("/offres/public/", { params });
  return data;
}