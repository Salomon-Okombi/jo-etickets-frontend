//features/catalog/useOffers.ts
import { useCallback, useEffect, useState } from "react";
import { listOffers } from "@/api/offers.api";
import type { Offer, Paginated, OfferListParams } from "@/types/offers";

export function useOffers(params?: OfferListParams) {
  const [rows, setRows] = useState<Offer[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data: Paginated<Offer> = await listOffers(params);
      setRows(data.results);
      setCount(data.count);
    } catch (e) {
      setError("Impossible de charger les offres.");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    offers: rows,
    count,
    loading,
    error,
    reload: load,
  };
}