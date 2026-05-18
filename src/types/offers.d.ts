export type OfferStatus = "ACTIVE" | "INACTIVE" | "EPUISEE" | "EXPIREE";

/**
 * Offre (API public + admin)
 * Ton backend renvoie :
 * - quota_billets_total / quota_billets_restant
 * - packs_total / packs_disponibles (calculés)
 * - prix_calcule (string)
 * - infos catégorie (nb_personnes, type_offre, multiplicateur)
 */
export interface Offer {
  id: number;

  evenement: number;
  evenement_nom?: string | null;

  categorie: number;
  categorie_code?: string | null;
  categorie_nom?: string | null;

  nom_offre: string;
  description?: string | null;

  // Prix (toujours en lecture)
  prix_calcule?: string;      // ex: "12.00"
  prix?: string | number;     // optionnel (prix stocké), utile admin/debug

  // Infos catégorie (lecture)
  nb_personnes?: number;      // 1/2/4
  multiplicateur?: number;    // alias métier
  type_offre?: string;        // code catégorie (SOLO/DUO/FAMILLE)

  // Quota en billets (places) : c’est ton stock réel
  quota_billets_total: number;
  quota_billets_restant: number;

  // Quota exprimé en packs (calculé) :
  // packs_disponibles = quota_billets_restant // nb_personnes
  packs_total?: number;
  packs_disponibles?: number;

  // Fenêtre de vente
  date_debut_vente: string;   // ISO datetime
  date_fin_vente: string;     // ISO datetime

  statut: OfferStatus;
  est_disponible?: boolean;   // lecture (public/admin)
}

/* Pagination DRF */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/* Paramètres liste offres (alignés avec filterset_fields/search/ordering) */
export interface OfferListParams {
  page?: number;
  page_size?: number;

  // filtres DRF
  evenement?: number;
  categorie?: number;
  statut?: OfferStatus;

  // recherche/tri
  search?: string;
  ordering?: string;
}

/**
 * Payload admin : aligné sur OffreAdminSerializer (quota billets)
 * Aucun prix en entrée (prix dérivé)
 * Aucun nb_personnes/type_offre en entrée (vient de la catégorie)
 */
export interface OfferCreatePayload {
  evenement: number;
  categorie: number;

  nom_offre: string;
  description?: string | null;

  quota_billets_total: number;
  quota_billets_restant: number;

  date_debut_vente: string;   // ISO datetime
  date_fin_vente: string;     // ISO datetime

  statut: OfferStatus;
}

export type OfferUpdatePayload = Partial<OfferCreatePayload>;