// src/features/cart/utils/totals.ts

import type { Cart, CartLine } from "@/types/carts";
import type { Offer } from "@/types/offers";

/**
 * Calcule le sous-total d’une ligne de panier.
 * Retourne toujours un nombre (0 par défaut).
 */
export function lineTotal(line: CartLine): number {
  const price = Number(line.prix_unitaire ?? 0);
  const quantity = Number(line.quantite ?? 0);
  return price * quantity;
}

/**
 * Calcule le total du panier à partir de ses lignes.
 */
export function cartTotal(cart: Cart): number {
  if (!cart.lignes || cart.lignes.length === 0) {
    return 0;
  }

  return cart.lignes.reduce(
    (sum: number, line: CartLine) => sum + lineTotal(line),
    0
  );
}

/**
 * Calcule le total pour une offre (prix * quantité).
 */
export function offerTotal(offer: Offer, quantite: number = 1): number {
  return Number(offer.prix ?? 0) * quantite;
}

/**
 * Formate un nombre ou une string en prix €.
 */
export function formatPrice(
  value: number | string,
  currency: string = "EUR"
): string {
  const num = typeof value === "string" ? Number(value) : value;

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(isNaN(num) ? 0 : num);
}

/**
 * Résumé du panier :
 * - nombre total d’articles
 * - montant total
 */
export function cartSummary(cart: Cart): {
  totalArticles: number;
  totalMontant: number;
} {
  const totalArticles = cart.lignes.reduce(
    (sum: number, line: CartLine) => sum + Number(line.quantite ?? 0),
    0
  );

  const totalMontant = cartTotal(cart);

  return { totalArticles, totalMontant };
}