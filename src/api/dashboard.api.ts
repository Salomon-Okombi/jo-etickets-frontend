// src/api/dashboard.api.ts
import  api  from "./axiosClient";

export type DashboardOverview = {
  nb_evenements: number;
  nb_offres: number;
  nb_commandes: number;
  nb_utilisateurs: number;
  chiffre_affaires: number; // ou string selon ton backend
  nb_tickets: number;       // réservations = tickets
};

export type TicketRow = {
  id: number;
  utilisateur: string;      // ex: "test bah" ou email
  offre: string;            // ex: "family" ou "PROMOS"
  qr_url: string | null;    // URL image QR
  created_at?: string;
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export async function getAdminOverview() {
  const { data } = await api.get<DashboardOverview>("/stats/overview/");
  return data;
}

/**
 * Liste des tickets (réservations) pour le tableau
 * Exemples:
 *  - /admin/tickets/
 *  - /billets/
 *  - /tickets/
 */
export async function listAdminTickets(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}) {
  const { data } = await api.get<Paginated<TicketRow>>("/admin/tickets/", { params });
  return data;
}