// src/api/stats.api.ts
import  api  from "./axiosClient";

/* ------------------------------------------------------------------
   Types
------------------------------------------------------------------ */
export interface SalesStats {
  id: number;
  offre: number;
  offre_nom: string;
  nombre_ventes: number;
  chiffre_affaires: string; // DecimalField renvoyé en string par DRF
  date_derniere_maj: string;
  moyenne_ventes_jour: string; // décimal (moyenne)
  pic_ventes_heure: string | null; // ISO ou null
}

export interface GlobalStats {
  ventes_totales: number;
  chiffre_affaires_total: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/* ------------------------------------------------------------------
    Endpoints : /api/statistiques/ventes/
   - GET    /ventes/                  -> listSalesStats
   - GET    /ventes/:id/              -> getSalesStats
   - GET    /ventes/global/           -> getGlobalSalesStats
------------------------------------------------------------------ */

/**
 * Liste paginée des statistiques de ventes (admin seulement)
 * Option : filtrer par nom d’offre, ou trier (si DRF FilterBackend activé)
 */
export async function listSalesStats(params?: {
  page?: number;
  search?: string;
  ordering?: string;
}): Promise<Paginated<SalesStats>> {
  const { data } = await api.get<Paginated<SalesStats>>("/statistiques/ventes/", { params });
  return data;
}

/**
 * Détail des statistiques pour une offre spécifique (admin)
 */
export async function getSalesStats(id: number): Promise<SalesStats> {
  const { data } = await api.get<SalesStats>(`/statistiques/ventes/${id}/`);
  return data;
}

/**
 * Statistiques globales agrégées (toutes les offres confondues)
 * Endpoint : GET /api/statistiques/ventes/global/
 */
export async function getGlobalSalesStats(): Promise<GlobalStats> {
  const { data } = await api.get<GlobalStats>("/statistiques/ventes/global/");
  return data;
}
