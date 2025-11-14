// src/hooks/orders/useOrders.ts
import { useEffect, useState } from "react";
import {
  listOrders,
  getOrder,
  payOrder,
  generateTickets,
  type Order,
  type Paginated,
} from "@/api/orders.api";

type ListParams = {
  page?: number;
  search?: string;
  ordering?: string;
};

export function useOrders(initial?: ListParams) {
  const [params, setParams] = useState<ListParams>({
    page: initial?.page ?? 1,
    search: initial?.search ?? "",
    ordering: initial?.ordering ?? "",
  });
  const [data, setData] = useState<Paginated<Order> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  async function fetchList(p: ListParams = params) {
    setLoading(true);
    setError(null);
    try {
      const resp = await listOrders({
        page: p.page,
        search: p.search,
        ordering: p.ordering,
      } as any);
      setData(resp);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.page, params.search, params.ordering]);

  const setPage = (page: number) => setParams((prev) => ({ ...prev, page }));
  const setSearch = (search: string) =>
    setParams((prev) => ({ ...prev, page: 1, search }));
  const setOrdering = (ordering: string) =>
    setParams((prev) => ({ ...prev, page: 1, ordering }));

  return {
    data,
    items: data?.results ?? [],
    page: params.page ?? 1,
    search: params.search ?? "",
    ordering: params.ordering ?? "",
    hasNext: Boolean(data?.next),
    hasPrev: Boolean(data?.previous),
    setPage,
    setSearch,
    setOrdering,
    reload: () => fetchList(),
    loading,
    error,
  };
}

/* ------------------------------------------------------------------
   🔹 Détail + actions (payer / générer billets)
------------------------------------------------------------------ */

export function useOrderDetail(id?: number) {
  const [item, setItem] = useState<Order | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<unknown>(null);

  async function fetchOne() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await getOrder(id);
      setItem(resp);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  async function markAsPaid(methode_paiement = "Carte bancaire") {
    if (!id) return;
    setLoading(true);
    try {
      // 1) on appelle l’endpoint de paiement
      const resp = await payOrder(id, { methode_paiement });
      // 2) on recharge la commande pour mettre à jour `item`
      await fetchOne();
      return resp; // PayOrderResponse (message + billets)
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function generateEBillets() {
    if (!id) return;
    setLoading(true);
    try {
      const resp = await generateTickets(id);
      return resp;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOne();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return {
    item,
    loading,
    error,
    reload: fetchOne,
    markAsPaid,
    generateEBillets,
  };
}
