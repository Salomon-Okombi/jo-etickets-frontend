// src/api/carts.api.ts
import { api } from "./axiosClient";

/* ------------------------------------------------------------------
   Types alignés sur le backend
------------------------------------------------------------------ */
export interface Offer {
  id: number;
  nom_offre: string;
  description: string;
  prix: number;
  nb_personnes: number;
  type_offre: string;
  stock_disponible: number;
}

export interface CartLine {
  id: number;
  offre: number; // ID de l’offre
  offre_nom?: string;
  offre_prix?: string;
  quantite: number;
  prix_unitaire: string;
  sous_total: string;
  date_ajout: string;
}

export type CartStatus = "ACTIF" | "VALIDE" | "ABANDONNE" | "EXPIRE";

export interface Cart {
  id: number;
  utilisateur: number;
  statut: CartStatus;
  montant_total: string;
  date_creation: string;
  date_expiration: string | null;
  lignes: CartLine[];
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/* ------------------------------------------------------------------
   Endpoints : /api/paniers/
------------------------------------------------------------------ */

/**
 * GET /paniers/ — liste paginée des paniers de l’utilisateur connecté.
 */
export async function listCarts(params?: {
  page?: number;
}): Promise<Paginated<Cart>> {
  const { data } = await api.get<Paginated<Cart>>("/paniers/", { params });
  return data;
}

/**
 * POST /paniers/add/ — ajouter une offre au panier actif.
 */
export async function addToCart(
  offreId: number,
  quantite: number
): Promise<CartLine> {
  const payload = { offre: offreId, quantite };
  const { data } = await api.post<CartLine>("/paniers/add/", payload);
  return data;
}

/**
 * DELETE /paniers/{panier_id}/supprimer-ligne/{ligne_id}/ — supprimer une ligne.
 */
export async function deleteCartLine(
  panierId: number,
  ligneId: number
): Promise<void> {
  await api.delete(`/paniers/${panierId}/supprimer-ligne/${ligneId}/`);
}

/**
 * DELETE /paniers/{id}/ — supprimer un panier complet.
 */
export async function deleteCart(panierId: number): Promise<void> {
  await api.delete(`/paniers/${panierId}/`);
}

/* ------------------------------------------------------------------
   Utilitaires front
------------------------------------------------------------------ */

/**
 * Récupère le panier ACTIF de l’utilisateur s’il existe.
 */
export async function getActiveCart(): Promise<Cart | null> {
  const page1 = await listCarts({ page: 1 });
  return page1.results.find((c) => c.statut === "ACTIF") ?? null;
}

/**
 * Calcule le total côté front à partir des lignes.
 */
export function computeCartTotal(cart: Cart): number {
  return cart.lignes.reduce(
    (sum, line) => sum + parseFloat(line.sous_total ?? "0"),
    0
  );
}
