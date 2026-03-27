import api from "./axiosClient";
import type { Cart, CartLine } from "@/types/carts";

/* ------------------------------
   Helpers
-------------------------------- */

function unwrapCart(data: any): Cart {
  return {
    id: Number(data?.id ?? 0),
    statut: String(data?.statut ?? "ACTIF"),
    montant_total: data?.montant_total ?? "0.00",
    lignes: Array.isArray(data?.lignes)
      ? data.lignes.map((l: any): CartLine => ({
          id: Number(l.id),
          offre: Number(l.offre),
          quantite: Number(l.quantite ?? 1),
          prix_unitaire: Number(l.prix_unitaire),
          sous_total: Number(l.sous_total),
          date_ajout: l.date_ajout,
        }))
      : [],
  };
}

function unwrapPaginated<T>(data: any): T[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

/* ------------------------------
   API
-------------------------------- */

/** Récupère le panier ACTIF */
export async function getActiveCart(): Promise<Cart | null> {
  const { data } = await api.get("/paniers/");
  const carts = unwrapPaginated<any>(data);

  const actif = carts.find(
    (c) => String(c.statut).toUpperCase() === "ACTIF"
  );
  if (!actif) return null;

  return unwrapCart(actif);
}

/** Ajoute une offre au panier */
export async function addToCart(
  offre: number,
  quantite: number = 1
): Promise<void> {
  await api.post("/paniers/add/", { offre, quantite });
}

/** Supprime une ligne du panier */
export async function removeCartLine(
  panierId: number,
  ligneId: number
): Promise<void> {
  await api.delete(
    `/paniers/${panierId}/supprimer-ligne/${ligneId}/`
  );
}

/** Supprime entièrement le panier */
export async function deleteCart(panierId: number): Promise<void> {
  await api.delete(`/paniers/${panierId}/`);
}

/** Diminue la quantité d’une ligne */
export async function decreaseLine(
  panierId: number,
  line: CartLine
): Promise<void> {
  if (line.quantite <= 1) {
    await removeCartLine(panierId, line.id);
    return;
  }

  await removeCartLine(panierId, line.id);
  await addToCart(line.offre, line.quantite - 1);
}

/** Augmente la quantité d’une ligne */
export async function increaseLine(line: CartLine): Promise<void> {
  await addToCart(line.offre, 1);
}