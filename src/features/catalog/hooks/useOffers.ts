import { useEffect, useState } from "react";
import {
  listOffers,
  getOffer,
  type Offer,
  type Paginated,
} from "@/api/offers.api";

type ListParams = {
  page?: number;
  search?: string;
  ordering?: string;
  eventId?: number; // si tu filtres côté backend par événement (optionnel)
};

export function useOffers(initial?: ListParams) {
  const [params, setParams] = useState<ListParams>({
    page: initial?.page ?? 1,
    search: initial?.search ?? "",
    ordering: initial?.ordering ?? "",
    eventId: initial?.eventId,
  });
  const [data, setData] = useState<Paginated<Offer> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  async function fetchList(p: ListParams = params) {
    setLoading(true);
    setError(null);
    try {
      const resp = await listOffers({
        page: p.page,
        search: p.search,
        ordering: p.ordering,
        eventId: p.eventId,
      } as any); // adapter si ton endpoint accepte ces params
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
  }, [params.page, params.search, params.ordering, params.eventId]);

  const setPage = (page: number) => setParams((prev) => ({ ...prev, page }));
  const setSearch = (search: string) =>
    setParams((prev) => ({ ...prev, page: 1, search }));
  const setOrdering = (ordering: string) =>
    setParams((prev) => ({ ...prev, page: 1, ordering }));
  const setEventId = (eventId?: number) =>
    setParams((prev) => ({ ...prev, page: 1, eventId }));

  const hasNext = Boolean(data?.next);
  const hasPrev = Boolean(data?.previous);

  return {
    data,
    items: data?.results ?? [],
    page: params.page ?? 1,
    search: params.search ?? "",
    ordering: params.ordering ?? "",
    eventId: params.eventId,
    hasNext,
    hasPrev,
    setPage,
    setSearch,
    setOrdering,
    setEventId,
    reload: () => fetchList(),
    loading,
    error,
  };
}

export function useOfferDetail(id?: number) {
  const [item, setItem] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<unknown>(null);

  async function fetchOne() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await getOffer(id);
      setItem(resp);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOne();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return { item, loading, error, reload: fetchOne };
}
