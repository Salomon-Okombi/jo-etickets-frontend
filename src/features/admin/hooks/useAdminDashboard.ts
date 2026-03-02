import { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminOverview, listAdminTickets, TicketRow } from "@/api/dashboard.api";

export default function useAdminDashboard() {
  const [overview, setOverview] = useState<any>(null);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [count, setCount] = useState(0);

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  const loadOverview = useCallback(async () => {
    try {
      setLoadingOverview(true);
      const data = await getAdminOverview();
      setOverview(data);
    } catch (e: any) {
      setError(e?.message ?? "Erreur chargement stats overview");
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const loadTickets = useCallback(async () => {
    try {
      setLoadingTickets(true);
      const data = await listAdminTickets({
        page,
        page_size: pageSize,
        search: search || undefined,
        ordering: "-id",
      });
      setTickets(data.results);
      setCount(data.count);
    } catch (e: any) {
      setError(e?.message ?? "Erreur chargement tickets");
    } finally {
      setLoadingTickets(false);
    }
  }, [page, pageSize, search]);

  const reload = useCallback(async () => {
    setError(null);
    await Promise.all([loadOverview(), loadTickets()]);
  }, [loadOverview, loadTickets]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count, pageSize]);

  return {
    overview,
    tickets,
    count,
    page,
    pageSize,
    search,
    loadingOverview,
    loadingTickets,
    error,
    totalPages,
    setPage,
    setPageSize,
    setSearch,
    reload,
  };
}