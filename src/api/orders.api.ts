import api from "@/api/axiosClient";
import type { Order, Paginated } from "@/types/orders";

/* ============================================================
   LISTE / LECTURE
============================================================ */

export async function listOrders(params?: {
  page?: number;
  search?: string;
  ordering?: string;
}) {
  const { data } = await api.get<Paginated<Order>>("/commandes/", {
    params,
  });
  return data;
}

export async function getOrder(id: number) {
  const { data } = await api.get<Order>(`/commandes/${id}/`);
  return data;
}

/* ============================================================
   CRÉATION COMMANDE
============================================================ */

export type CreateOrderItem = {
  offre: number;
  quantite: number;
};

export type CreateOrderPayload = {
  items: CreateOrderItem[];
};

export async function createOrder(payload: CreateOrderPayload) {
  const { data } = await api.post<Order>("/commandes/", payload);
  return data;
}

/* ============================================================
   PAIEMENT
============================================================ */

export type PayOrderPayload = {
  reference_paiement: string;
};

export async function payOrder(
  id: number,
  payload: PayOrderPayload
) {
  const { data } = await api.post<Order>(
    `/commandes/${id}/payer/`,
    payload
  );
  return data;
}