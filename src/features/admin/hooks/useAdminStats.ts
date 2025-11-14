// src/features/admin/hooks/useAdminStats.ts
import { useCallback, useEffect, useState } from "react";
import { api } from "@/api/axiosClient";

export interface OfferStats {
  offre_id: number;
  offre_nom: string;
  nombre_ventes: number;
  chiffre_affaires: string;
}

export interface GlobalStats {
  ventes_totales: number;
  chiffre_affaires_total: string;
  derniere_maj?: string | null;
}

export default function useAdminStats() {
  const [perOffer, setPerOffer] = useState<OfferStats[]>([]);
  const [global, setGlobal] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [offersRes, globalRes] = await Promise.all([
        api.get<OfferStats[]>("/statistiques/ventes/"),
        api.get<GlobalStats>("/statistiques/ventes/global/"),
      ]);
      setPerOffer(offersRes.data);
      setGlobal(globalRes.data);
    } catch (e: any) {
      setError(e.message ?? "Erreur de chargement des statistiques");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const topOffersByRevenue = perOffer
    .slice()
    .sort((a, b) => Number(b.chiffre_affaires) - Number(a.chiffre_affaires))
    .slice(0, 5);

  const topOffersBySales = perOffer
    .slice()
    .sort((a, b) => b.nombre_ventes - a.nombre_ventes)
    .slice(0, 5);

  return { perOffer, global, loading, error, reload, topOffersByRevenue, topOffersBySales };
}
