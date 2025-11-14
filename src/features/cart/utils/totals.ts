// src/utils/totals.ts
import type { Cart, CartLine } from "@/api/carts.api";
import type { Offer } from "@/api/offers.api";

/**
 * Calcule le sous-total d’une ligne de panier.
 * Retourne toujours un nombre flottant (0 par défaut).
 */
export function lineTotal(line: CartLine): number {
  const price = parseFloat(line.prix_unitaire ?? line.offre_prix ?? "0");
  return price * Number(line.quantite ?? 0);
}

/**
 * Calcule le total du panier à partir de ses lignes.
 * Si `cart.montant_total` est déjà exact côté backend, on peut l’utiliser directement.
 */
export function cartTotal(cart: Cart): number {
  if (!cart.lignes?.length) return 0;
  return cart.lignes.reduce((sum, l) => sum + lineTotal(l), 0);
}

/**
 * Calcule le total pour une offre (prix unitaire * quantité choisie).
 * Pratique pour la page Offre ou le résumé avant paiement.
 */
export function offerTotal(offer: Offer, quantite = 1): number {
  return Number(offer.prix ?? 0) * quantite;
}

/**
 * Formate un nombre (prix) en euros.
 * Exemple : formatPrice(1250.5) → "1 250,50 €"
 */
export function formatPrice(value: number | string, currency = "EUR"): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(isNaN(num) ? 0 : num);
}

/**
 * Donne un résumé des totaux du panier :
 * - nombre total d’articles
 * - total TTC (somme des sous-totaux)
 */
export function cartSummary(cart: Cart) {
  const totalArticles = cart.lignes?.reduce((sum, l) => sum + Number(l.quantite ?? 0), 0) ?? 0;
  const totalMontant = cartTotal(cart);
  return { totalArticles, totalMontant };
}
