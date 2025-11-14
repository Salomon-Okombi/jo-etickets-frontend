import { api } from "./axiosClient";

/* ------------------------------------------------------------------
   🧱 Types
------------------------------------------------------------------ */
/* ------------------------------------------------------------------
   ⚙️ Endpoints : /api/billets/
   - GET    /billets/                   -> listTickets (auth)
   - GET    /billets/:id/               -> getTicket (auth)
   - GET    /billets/:id/telecharger/   -> downloadTicketQRCode (auth)
   - PATCH  /billets/:id/               -> updateTicket (admin)
   - DELETE /billets/:id/               -> deleteTicket (admin)
------------------------------------------------------------------ */

export type TicketStatus = "VALIDE" | "UTILISE" | "ANNULE" | "EXPIRE";

export interface Ticket {
  id: number;
  utilisateur: number;
  offre: number;
  offre_nom?: string;
  numero_billet: string;
  qr_code: string; // base64 ou URL
  prix_paye: string; // DecimalField renvoyé en string
  statut: TicketStatus;
  date_creation: string;
  date_utilisation?: string | null;
  lieu_utilisation?: string | null;
}

/** Pagination standard DRF */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/* ------------------------------------------------------------------
   ⚙️ Endpoints : /api/billets/
------------------------------------------------------------------ */

/**
 * Liste paginée des billets (utilisateur ou admin)
 */
export async function listTickets(params?: {
  page?: number;
  search?: string;
  statut?: TicketStatus;
}): Promise<Paginated<Ticket>> {
  const { data } = await api.get<Paginated<Ticket>>("/billets/", { params });
  return data;
}

/**
 * Détail d’un billet
 */
export async function getTicket(id: number): Promise<Ticket> {
  const { data } = await api.get<Ticket>(`/billets/${id}/`);
  return data;
}

/**
 * Télécharger le QR Code d’un billet (PNG)
 */
export async function downloadTicketPng(id: number): Promise<Blob> {
  const { data } = await api.get(`/billets/${id}/telecharger/`, {
    responseType: "blob",
  });
  return data;
}

/**
 * Télécharger le billet complet en PDF
 */
export async function downloadTicketPdf(id: number): Promise<Blob> {
  const { data } = await api.get(`/billets/${id}/pdf/`, {
    responseType: "blob",
  });
  return data;
}

/**
 * Validation d’un billet (par ID) — admin ou borne
 * Exemple payload : { lieu_utilisation, date_utilisation }
 */
export async function validateTicket(
  id: number,
  payload?: { lieu_utilisation?: string; date_utilisation?: string }
): Promise<Ticket> {
  const { data } = await api.post<Ticket>(`/billets/${id}/valider/`, payload ?? {});
  return data;
}

/**
 * Validation d’un billet via clé unique (clé QR)
 */
export async function validateTicketByKey(
  cle_finale: string,
  payload?: { lieu_utilisation?: string; date_utilisation?: string }
): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(
    "/billets/valider-par-cle/",
    { cle_finale, ...payload }
  );
  return data;
}

/**
 * Annuler un billet (ex: remboursement)
 */
export async function cancelTicket(
  id: number,
  raison?: string
): Promise<Ticket> {
  const { data } = await api.post<Ticket>(`/billets/${id}/annuler/`, { raison });
  return data;
}

/**
 * Mise à jour d’un billet (admin)
 */
export async function updateTicket(
  id: number,
  payload: Partial<Pick<Ticket, "statut">>
): Promise<Ticket> {
  const { data } = await api.patch<Ticket>(`/billets/${id}/`, payload);
  return data;
}

/**
 * Suppression d’un billet (admin)
 */
export async function deleteTicket(id: number): Promise<void> {
  await api.delete(`/billets/${id}/`);
}
