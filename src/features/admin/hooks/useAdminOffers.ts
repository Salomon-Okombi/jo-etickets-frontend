// src/features/admin/hooks/useAdminOffers.ts
import { useCallback, useEffect, useState } from "react";
import  api  from "@/api/axiosClient";

export interface AdminOffer {
  id: number;
  nom_offre: string;
  prix: number | string;
  stock_disponible: number;
  stock_total: number;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export default function useAdminOffers() {
  const [list, setList] = useState<Paginated<AdminOffer> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Paginated<AdminOffer>>("/admin/offers/");
      setList(data);
    } catch (e: any) {
      setError(e.message ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { list, loading, error, reload };
}
