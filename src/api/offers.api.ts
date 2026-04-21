//offers/api.ts
import api from "./axiosClient";
import type {
  Offer,
  Paginated,
  OfferListParams,
  OfferCreatePayload,
  OfferUpdatePayload,
} from "@/types/offers";

/* ------------------------------
   LIST / GET
-------------------------------- */

export async function listOffers(
  params?: OfferListParams
): Promise<Paginated<Offer>> {
  const { data } = await api.get("/offres/", { params });
  return data;
}

export async function getOffer(id: number): Promise<Offer> {
  const { data } = await api.get<Offer>(`/offres/${id}/`);
  return data;
}

/* ------------------------------
   CREATE / UPDATE / DELETE
-------------------------------- */

export async function createOffer(
  payload: OfferCreatePayload
): Promise<Offer> {
  const { data } = await api.post<Offer>("/offres/", payload);
  return data;
}

export async function updateOffer(
  id: number,
  payload: OfferUpdatePayload
): Promise<Offer> {
  const { data } = await api.patch<Offer>(
    `/offres/${id}/`,
    payload
  );
  return data;
}

export async function deleteOffer(id: number): Promise<void> {
  await api.delete(`/offres/${id}/`);
}