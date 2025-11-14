import { useEffect, useState } from "react";
import {
  listEvents,
  getEvent,
  type Event,
  type Paginated,
} from "@/api/events.api";

type ListParams = {
  page?: number;
  search?: string;
  ordering?: string;
};

export function useEvents(initial?: ListParams) {
  const [params, setParams] = useState<ListParams>({
    page: initial?.page ?? 1,
    search: initial?.search ?? "",
    ordering: initial?.ordering ?? "",
  });
  const [data, setData] = useState<Paginated<Event> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  async function fetchList(p: ListParams = params) {
    setLoading(true);
    setError(null);
    try {
      const resp = await listEvents({
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.page, params.search, params.ordering]);

  const setPage = (page: number) => setParams((prev) => ({ ...prev, page }));
  const setSearch = (search: string) =>
    setParams((prev) => ({ ...prev, page: 1, search }));
  const setOrdering = (ordering: string) =>
    setParams((prev) => ({ ...prev, page: 1, ordering }));

  const hasNext = Boolean(data?.next);
  const hasPrev = Boolean(data?.previous);

  return {
    data,
    items: data?.results ?? [],
    page: params.page ?? 1,
    search: params.search ?? "",
    ordering: params.ordering ?? "",
    hasNext,
    hasPrev,
    setPage,
    setSearch,
    setOrdering,
    reload: () => fetchList(),
    loading,
    error,
  };
}

export function useEventDetail(id?: number) {
  const [item, setItem] = useState<Event | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<unknown>(null);

  async function fetchOne() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await getEvent(id);
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
