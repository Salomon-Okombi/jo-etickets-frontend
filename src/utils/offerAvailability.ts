// src/utils/offerAvailability.ts
import type { Offer, OfferStatus } from "@/types/offers";

export function computeOfferAvailability(
  o: Offer
): { ok: boolean; label: string } {

  //  CORRECTION
  const stock = Number(o.quota_billets_restant ?? 0);
  const statut = (o.statut ?? "INACTIVE") as OfferStatus;

  //  statut backend
  if (statut !== "ACTIVE") {
    if (statut === "EPUISEE") return { ok: false, label: "Épuisée" };
    if (statut === "EXPIREE") return { ok: false, label: "Expirée" };
    return { ok: false, label: "Indisponible" };
  }

  //  stock réel
  if (stock <= 0) {
    return { ok: false, label: "Épuisée" };
  }

  const now = new Date();

  //  date début vente
  if (o.date_debut_vente) {
    const start = new Date(o.date_debut_vente);

    if (!Number.isNaN(start.getTime()) && now < start) {
      return { ok: false, label: "Bientôt" };
    }
  }

  //  date fin vente
  if (o.date_fin_vente) {
    const end = new Date(o.date_fin_vente);

    if (!Number.isNaN(end.getTime()) && now > end) {
      return { ok: false, label: "Expirée" };
    }
  }

  //  dispo finale
  return { ok: true, label: "Disponible" };
}