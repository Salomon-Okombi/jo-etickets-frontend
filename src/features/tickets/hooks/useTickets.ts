// src/hooks/useTickets.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listTickets,
  getTicket,
  validateTicketByKey,
  validateTicket,
  downloadTicketPng,
  downloadTicketPdf,
  cancelTicket,
  deleteTicket,
  type Ticket,
} from "@/api/tickets.api";

interface UseTicketsOptions {
  autoFetch?: boolean;
}

export function useTickets(options: UseTicketsOptions = {}) {
  const { autoFetch = true } = options;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  /* ----------------------- Fetch list ----------------------- */
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listTickets(); // GET /billets/
      setTickets(data.results ?? []); // ✅ utilise data.results
    } catch (e: any) {
      setError(e?.message ?? "Erreur lors du chargement des billets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) void fetchTickets();
  }, [autoFetch, fetchTickets]);

  /* ----------------------- Get one -------------------------- */
  const fetchTicket = useCallback(async (id: number) => {
    setError(null);
    try {
      const t = await getTicket(id);
      setTickets((prev) => {
        const idx = prev.findIndex((x) => x.id === id);
        if (idx === -1) return [...prev, t];
        const copy = [...prev];
        copy[idx] = t;
        return copy;
      });
      return t;
    } catch (e: any) {
      setError(e?.message ?? "Erreur lors du chargement du billet");
      throw e;
    }
  }, []);

  /* ----------------------- Validate (by id) ----------------- */
  const validateById = useCallback(
    async (id: number, payload?: { lieu_utilisation?: string; date_utilisation?: string }) => {
      setError(null);
      try {
        const updated = await validateTicket(id, payload);
        setTickets((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...updated } : t))
        );
      } catch (e: any) {
        setError(e?.message ?? "Impossible de valider le billet");
        throw e;
      }
    },
    []
  );

  /* ----------------------- Validate (by key) ---------------- */
  const validateByKey = useCallback(
    async (cle_finale: string, payload?: { lieu_utilisation?: string; date_utilisation?: string }) => {
      setError(null);
      try {
        await validateTicketByKey(cle_finale, payload);
      } catch (e: any) {
        setError(e?.message ?? "Impossible de valider le billet via la clé");
        throw e;
      }
    },
    []
  );

  /* ----------------------- Cancel --------------------------- */
  const cancelById = useCallback(async (id: number, raison?: string) => {
    setError(null);
    try {
      const updated = await cancelTicket(id, raison);
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updated } : t))
      );
    } catch (e: any) {
      setError(e?.message ?? "Impossible d’annuler le billet");
      throw e;
    }
  }, []);

  /* ----------------------- Delete --------------------------- */
  const removeById = useCallback(async (id: number) => {
    setError(null);
    try {
      await deleteTicket(id);
      setTickets((prev) => prev.filter((t) => t.id !== id));
    } catch (e: any) {
      setError(e?.message ?? "Impossible de supprimer le billet");
      throw e;
    }
  }, []);

  /* ----------------------- Downloads ------------------------ */
  const getPngBlob = useCallback(async (id: number) => {
    setError(null);
    try {
      return await downloadTicketPng(id);
    } catch (e: any) {
      setError(e?.message ?? "Téléchargement du QR PNG impossible");
      throw e;
    }
  }, []);

  const getPdfBlob = useCallback(async (id: number) => {
    setError(null);
    try {
      return await downloadTicketPdf(id);
    } catch (e: any) {
      setError(e?.message ?? "Téléchargement du PDF impossible");
      throw e;
    }
  }, []);

  const hasTickets = useMemo(() => tickets.length > 0, [tickets]);

  return {
    tickets,
    loading,
    error,
    hasTickets,
    fetchTickets,
    fetchTicket,
    validateById,
    validateByKey,
    cancelById,
    removeById,
    getPngBlob,
    getPdfBlob,
  };
}
