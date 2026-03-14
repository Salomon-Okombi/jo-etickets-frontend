import { api } from "./axiosClient";
import type { Cart, CartLine } from "@/types/carts";

function isCanceledError(err: any) {
  return err?.code === "ERR_CANCELED" || err?.name === "CanceledError";
}

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
          prix_unitaire: l.prix_unitaire,
          sous_total: l.sous_total,
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

/**
 * Ton backend renvoie une LISTE de paniers via /paniers/
 * On récupère le panier ACTIF le plus récent.
 */
export async function getActiveCart(): Promise<Cart | null> {
  const { data } = await api.get("/paniers/");
  const carts = unwrapPaginated<any>(data);

  const actif = carts.find((c) => String(c.statut).toUpperCase() === "ACTIF");
  if (!actif) return null;

  return unwrapCart(actif);
}

/**
 * Ajout au panier via l'action:
 * POST /paniers/add/ {offre, quantite}
 * Ton serializer LignePanier accepte "offre" (id) + "quantite"
 */
export async function addToCart(offre: number, quantite = 1): Promise<void> {
  await api.post("/paniers/add/", { offre, quantite });
}

/**
 * Suppression d'une ligne:
 * DELETE /paniers/{panier_id}/supprimer-ligne/{ligne_id}/
 */
export async function removeCartLine(panierId: number, ligneId: number): Promise<void> {
  await api.delete(`/paniers/${panierId}/supprimer-ligne/${ligneId}/`);
}

/**
 * Diminution quantité sans endpoint dédié:
 * - si quantite==1 -> supprimer
 * - sinon -> supprimer la ligne puis ré-ajouter la même offre avec quantite-1
 */
export async function decreaseLine(panierId: number, line: CartLine): Promise<void> {
  if (line.quantite <= 1) {
    await removeCartLine(panierId, line.id);
    return;
  }
  await removeCartLine(panierId, line.id);
  await addToCart(line.offre, line.quantite - 1);
}

/**
 * Augmentation quantité:
 * on utilise addToCart(offre, 1)
 */
export async function increaseLine(line: CartLine): Promise<void> {
  await addToCart(line.offre, 1);
}