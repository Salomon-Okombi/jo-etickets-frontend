import api from "./axiosClient";
import type {
  Order,
  Paginated,
  OrderListParams,
  CreateOrderPayload,
  PayOrderPayload,
} from "@/types/orders";

/* ------------------------------
   Helpers
-------------------------------- */

function unwrapList<T>(data: any): { rows: T[]; count: number } {
  if (Array.isArray(data)) return { rows: data, count: data.length };
  if (data && Array.isArray(data.results)) {
    return {
      rows: data.results,
      count: Number(data.count ?? data.results.length),
    };
  }
  return { rows: [], count: 0 };
}

/* ------------------------------
   API
-------------------------------- */

export async function listOrders(
  params?: OrderListParams
): Promise<Paginated<Order>> {
  const { data } = await api.get("/commandes/", { params });
  return data;
}

export async function getOrder(id: number): Promise<Order> {
  const { data } = await api.get<Order>(`/commandes/${id}/`);
  return data;
}

export async function createOrder(
  payload: CreateOrderPayload
): Promise<Order> {
  const { data } = await api.post<Order>("/commandes/", payload);
  return data;
}

export async function payOrder(
  id: number,
  payload: PayOrderPayload
): Promise<Order> {
  const { data } = await api.post<Order>(
    `/commandes/${id}/payer/`,
    payload
  );
  return data;
}

export function unwrapOrders(data: any) {
  return unwrapList<Order>(data);
}