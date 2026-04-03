// src/hooks/useTickets.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listBillets,
  getBillet,
  validerBillet,
  validerBilletParCle,
  annulerBillet,
  deleteBillet,
  downloadBilletPng,
  downloadBilletPdf,
} from "@/api/billets.api";
import type { EBillet, Paginated } from "@/types/billets";

interface UseTicketsOptions {
  autoFetch?: boolean;
}

function unwrapBillets(
  data: Paginated<EBillet> | EBillet[]
): EBillet[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export function useTickets(options: UseTicketsOptions = {}) {
  const { autoFetch = true } = options;

  const [tickets, setTickets] = useState<EBillet[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  /* ======================= LIST ======================= */
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listBillets();
      setTickets(unwrapBillets(data));
    } catch (e: any) {
      setError(e?.message ?? "Erreur lors du chargement des billets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) void fetchTickets();
  }, [autoFetch, fetchTickets]);

  /* ======================= GET ONE ==================== */
  const fetchTicket = useCallback(async (id: number) => {
    setError(null);
    try {
      const billet = await getBillet(id);

      setTickets((prev) => {
        const index = prev.findIndex((b) => b.id === id);
        if (index === -1) return [...prev, billet];
        const copy = [...prev];
        copy[index] = billet;
        return copy;
      });

      return billet;
    } catch (e: any) {
      setError(e?.message ?? "Erreur lors du chargement du billet");
      throw e;
    }
  }, []);

  /* ======================= VALIDATE =================== */
  const validateById = useCallback(
    async (
      id: number,
      payload?: { lieu_utilisation?: string }
    ) => {
      setError(null);
      try {
        await validerBillet(id, payload);
        await fetchTicket(id); // resync propre
      } catch (e: any) {
        setError(e?.message ?? "Impossible de valider le billet");
        throw e;
      }
    },
    [fetchTicket]
  );

  const validateByKey = useCallback(
    async (
      cle_finale: string,
      payload?: { lieu_utilisation?: string }
    ) => {
      setError(null);
      try {
        await validerBilletParCle({ cle_finale, ...payload });
      } catch (e: any) {
        setError(e?.message ?? "Impossible de valider le billet via la clé");
        throw e;
      }
    },
    []
  );

  /* ======================= CANCEL ===================== */
  const cancelById = useCallback(async (id: number) => {
    setError(null);
    try {
      await annulerBillet(id);
      setTickets((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, statut: "ANNULE" } : b
        )
      );
    } catch (e: any) {
      setError(e?.message ?? "Impossible d’annuler le billet");
      throw e;
    }
  }, []);

  /* ======================= DELETE ===================== */
  const removeById = useCallback(async (id: number) => {
    setError(null);
    try {
      await deleteBillet(id);
      setTickets((prev) => prev.filter((b) => b.id !== id));
    } catch (e: any) {
      setError(e?.message ?? "Impossible de supprimer le billet");
      throw e;
    }
  }, []);

  /* ======================= DOWNLOAD =================== */
  const getPngBlob = useCallback(async (id: number) => {
    setError(null);
    try {
      return await downloadBilletPng(id);
    } catch (e: any) {
      setError(e?.message ?? "Téléchargement PNG impossible");
      throw e;
    }
  }, []);

  const getPdfBlob = useCallback(async (id: number) => {
    setError(null);
    try {
      return await downloadBilletPdf(id);
    } catch (e: any) {
      setError(e?.message ?? "Téléchargement PDF impossible");
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