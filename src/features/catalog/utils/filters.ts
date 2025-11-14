// src/features/catalog/utils/filters.ts
import type { Event } from "@/api/events.api";
import type { Offer } from "@/api/offers.api";

/* ------------------------------------------------------------------
   Types de filtres
------------------------------------------------------------------ */

export interface EventFilters {
  search?: string;          // texte à chercher sur nom / discipline / lieu
  discipline?: string;      // filtre par discipline_sportive
  dateFrom?: string;        // ISO string "YYYY-MM-DD"
  dateTo?: string;          // ISO string "YYYY-MM-DD"
}

export interface OfferFilters {
  search?: string;          // texte à chercher sur nom_offre / description
  minPrice?: number;
  maxPrice?: number;
  onlyAvailable?: boolean;  // true => stock_disponible > 0
}

/* ------------------------------------------------------------------
   Helpers internes
------------------------------------------------------------------ */

function normalize(str: string | null | undefined): string {
  return (str ?? "").toLowerCase().trim();
}

function inRangeDate(date: string, from?: string, to?: string): boolean {
  if (!date) return false;
  const d = date.slice(0, 10); // YYYY-MM-DD
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

/* ------------------------------------------------------------------
   Filtres ÉVÉNEMENTS
------------------------------------------------------------------ */

export function filterEvents(events: Event[], filters: EventFilters): Event[] {
  const { search, discipline, dateFrom, dateTo } = filters;

  const searchNorm = normalize(search);

  return events.filter((evt) => {
    // recherche texte
    if (searchNorm) {
      const haystack = [
        evt.nom,
        evt.discipline_sportive,
        evt.lieu_evenement,
        evt.description ?? "",
      ]
        .map(normalize)
        .join(" ");

      if (!haystack.includes(searchNorm)) {
        return false;
      }
    }

    // discipline
    if (discipline && normalize(evt.discipline_sportive) !== normalize(discipline)) {
      return false;
    }

    // plage de dates
    if ((dateFrom || dateTo) && !inRangeDate(evt.date_evenement, dateFrom, dateTo)) {
      return false;
    }

    return true;
  });
}

/* ------------------------------------------------------------------
   Filtres OFFRES
------------------------------------------------------------------ */

export function filterOffers(offers: Offer[], filters: OfferFilters): Offer[] {
  const { search, minPrice, maxPrice, onlyAvailable } = filters;
  const searchNorm = normalize(search);

  return offers.filter((offer) => {
    // recherche texte
    if (searchNorm) {
      const haystack = [
        offer.nom_offre,
        offer.description ?? "",
        String(offer.type_offre ?? ""),
      ]
        .map(normalize)
        .join(" ");

      if (!haystack.includes(searchNorm)) {
        return false;
      }
    }

    // price range
    const price = Number(offer.prix ?? 0);
    if (typeof minPrice === "number" && price < minPrice) return false;
    if (typeof maxPrice === "number" && price > maxPrice) return false;

    // stock
    if (onlyAvailable && (offer.stock_disponible ?? 0) <= 0) {
      return false;
    }

    return true;
  });
}

/* ------------------------------------------------------------------
   Tri simple (optionnel mais pratique)
------------------------------------------------------------------ */

export type OfferSortKey = "price-asc" | "price-desc" | "name-asc" | "name-desc";

export function sortOffers(offers: Offer[], sort: OfferSortKey): Offer[] {
  const copy = [...offers];

  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => Number(a.prix ?? 0) - Number(b.prix ?? 0));
    case "price-desc":
      return copy.sort((a, b) => Number(b.prix ?? 0) - Number(a.prix ?? 0));
    case "name-asc":
      return copy.sort((a, b) => a.nom_offre.localeCompare(b.nom_offre));
    case "name-desc":
      return copy.sort((a, b) => b.nom_offre.localeCompare(a.nom_offre));
    default:
      return copy;
  }
}

export type EventSortKey = "date-asc" | "date-desc" | "name-asc" | "name-desc";

export function sortEvents(events: Event[], sort: EventSortKey): Event[] {
  const copy = [...events];

  switch (sort) {
    case "date-asc":
      return copy.sort((a, b) => a.date_evenement.localeCompare(b.date_evenement));
    case "date-desc":
      return copy.sort((a, b) => b.date_evenement.localeCompare(a.date_evenement));
    case "name-asc":
      return copy.sort((a, b) => a.nom.localeCompare(b.nom));
    case "name-desc":
      return copy.sort((a, b) => b.nom.localeCompare(a.nom));
    default:
      return copy;
  }
}
