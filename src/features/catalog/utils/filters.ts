// src/features/catalog/utils/filters.ts
import type { Evenement as Event } from "@/types/evenements";
import type { Offer } from "@/types/offers";

/* ------------------------------------------------------------------
   Types de filtres
------------------------------------------------------------------ */

export interface EventFilters {
  search?: string;
  discipline?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface OfferFilters {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  onlyAvailable?: boolean;
}

/* ------------------------------------------------------------------
   Helpers internes
------------------------------------------------------------------ */

function normalize(str: string | null | undefined): string {
  return (str ?? "").toLowerCase().trim();
}

function inRangeDate(date: string, from?: string, to?: string): boolean {
  if (!date) return false;
  const d = date.slice(0, 10);

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
    //  recherche texte
    if (searchNorm) {
      const haystack = [
        evt.nom_evenement,
        evt.discipline,
        evt.lieu,
        evt.description_courte ?? "",
      ]
        .map(normalize)
        .join(" ");

      if (!haystack.includes(searchNorm)) {
        return false;
      }
    }

    // discipline
    if (discipline && normalize(evt.discipline) !== normalize(discipline)) {
      return false;
    }

    // date_evenement → date_debut
    if ((dateFrom || dateTo) && !inRangeDate(evt.date_debut, dateFrom, dateTo)) {
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

    //  prix
    const price = Number(offer.prix ?? offer.prix_calcule ?? 0);

    if (typeof minPrice === "number" && price < minPrice) return false;
    if (typeof maxPrice === "number" && price > maxPrice) return false;

    //  CORRECTION : stock_disponible → est_disponible
    if (onlyAvailable && !offer.est_disponible) {
      return false;
    }

    return true;
  });
}

/* ------------------------------------------------------------------
   Tri OFFRES 
------------------------------------------------------------------ */

export type OfferSortKey =
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc";

export function sortOffers(offers: Offer[], sort: OfferSortKey): Offer[] {
  const copy = [...offers];

  switch (sort) {
    case "price-asc":
      return copy.sort(
        (a, b) =>
          Number(a.prix ?? a.prix_calcule ?? 0) -
          Number(b.prix ?? b.prix_calcule ?? 0)
      );

    case "price-desc":
      return copy.sort(
        (a, b) =>
          Number(b.prix ?? b.prix_calcule ?? 0) -
          Number(a.prix ?? a.prix_calcule ?? 0)
      );

    case "name-asc":
      return copy.sort((a, b) =>
        a.nom_offre.localeCompare(b.nom_offre)
      );

    case "name-desc":
      return copy.sort((a, b) =>
        b.nom_offre.localeCompare(a.nom_offre)
      );

    default:
      return copy;
  }
}

/* ------------------------------------------------------------------
   Tri ÉVÉNEMENTS 
------------------------------------------------------------------ */

export type EventSortKey =
  | "date-asc"
  | "date-desc"
  | "name-asc"
  | "name-desc";

export function sortEvents(events: Event[], sort: EventSortKey): Event[] {
  const copy = [...events];

  switch (sort) {
    case "date-asc":
      //  CORRECTION
      return copy.sort((a, b) =>
        a.date_debut.localeCompare(b.date_debut)
      );

    case "date-desc":
      //  CORRECTION
      return copy.sort((a, b) =>
        b.date_debut.localeCompare(a.date_debut)
      );

    case "name-asc":
      return copy.sort((a, b) =>
        a.nom_evenement.localeCompare(b.nom_evenement)
      );

    case "name-desc":
      return copy.sort((a, b) =>
        b.nom_evenement.localeCompare(a.nom_evenement)
      );

    default:
      return copy;
  }
}