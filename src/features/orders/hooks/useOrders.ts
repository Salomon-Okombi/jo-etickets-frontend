//orders/hooks/useOrders.ts
import { useEffect, useState } from "react";
import {
  listOrders,
  getOrder,
  payOrder,
} from "@/api/orders.api";

import type { Order, Paginated } from "@/types/orders";

/* ============================================================
   Types
============================================================ */

type ListParams = {
  page?: number;
  search?: string;
  ordering?: string;
};

/* ============================================================
    LISTE DES COMMANDES
============================================================ */

export function useOrders(initial?: ListParams) {
  const [params, setParams] = useState<ListParams>({
    page: initial?.page ?? 1,
    search: initial?.search ?? "",
    ordering: initial?.ordering ?? "",
  });

  const [data, setData] = useState<Paginated<Order> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  async function fetchList(p: ListParams = params) {
    setLoading(true);
    setError(null);
    try {
      const resp = await listOrders({
        page: p.page,
        search: p.search,
        ordering: p.ordering,
      });
      setData(resp);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
  }, [params.page, params.search, params.ordering]);

  const setPage = (page: number) =>
    setParams((prev) => ({ ...prev, page }));

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

/* ============================================================
    DÉTAIL D’UNE COMMANDE
============================================================ */

export function useOrderDetail(id?: number) {
  const [item, setItem] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(id));
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

  async function markAsPaid(reference_paiement: string = "CARTE") {
    if (!id) return;

    setLoading(true);
    try {
      const resp = await payOrder(id, { reference_paiement });
      await fetchOne(); // 🔥 billets déjà générés côté backend
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
  }, [id]);

  return {
    item,
    loading,
    error,
    reload: fetchOne,
    markAsPaid,
  };
}