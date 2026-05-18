/* =========================================================
   STATUS OFFRE
========================================================= */

export type OfferStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "EPUISEE"
  | "EXPIREE";

/* =========================================================
   MODÈLE OFFRE (API public + admin)
========================================================= */

export interface Offer {
  id: number;

  // Relations
  evenement: number;
  evenement_nom?: string | null;

  categorie: number;
  categorie_code?: string | null;
  categorie_nom?: string | null;

  // Infos principales
  nom_offre: string;
  description?: string | null;

  // Prix
  prix_calcule?: string;       // ex: "12.00"
  prix?: string | number;      // parfois présent (admin)

  // Catégorie (lecture uniquement)
  nb_personnes?: number;
  multiplicateur?: number;
  type_offre?: string;

  // Stock réel (places)
  quota_billets_total: number;
  quota_billets_restant: number;

  // Packs calculés
  packs_total?: number;
  packs_disponibles?: number;

  // Fenêtre de vente
  date_debut_vente: string;
  date_fin_vente: string;

  // Statut métier
  statut: OfferStatus;

  // Calcul backend
  est_disponible?: boolean;
}

/* =========================================================
   PAGINATION DRF  IMPORTANT (corrige ton erreur)
========================================================= */

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/* =========================================================
   PARAMÈTRES DE REQUÊTE (listOffers)
========================================================= */

export interface OfferListParams {
  page?: number;
  page_size?: number;

  evenement?: number;
  categorie?: number;
  statut?: OfferStatus;

  search?: string;
  ordering?: string;
}

/* =========================================================
   PAYLOADS ADMIN
========================================================= */

export interface OfferCreatePayload {
  evenement: number;
  categorie: number;

  nom_offre: string;
  description?: string | null;

  quota_billets_total: number;
  quota_billets_restant: number;

  date_debut_vente: string;
  date_fin_vente: string;

  statut: OfferStatus;
}

export type OfferUpdatePayload = Partial<OfferCreatePayload>;

/* =========================================================
   HELPERS (OPTIONNEL MAIS UTILE)
========================================================= */

/**
 * Nombre de packs disponibles
 */
export function getAvailablePacks(offer: Offer): number {
  if (!offer.nb_personnes) return 0;
  return Math.floor(
    (offer.quota_billets_restant ?? 0) / offer.nb_personnes
  );
}

/**
 * Vérifie si l'offre est vendable côté front
 */
export function isOfferAvailable(offer: Offer): boolean {
  return Boolean(offer.est_disponible);
}