export type BilletStatus = "VALIDE" | "UTILISE" | "ANNULE" | "EXPIRE" | string;

export interface EBillet {
  id: number;
  numero_billet: string;

  utilisateur: number;
  utilisateur_nom: string;

  offre: number;
  offre_nom: string;

  validateur: number | null;

  date_achat: string;
  prix_paye: number | string;

  statut: BilletStatus;

  date_utilisation: string | null;
  lieu_utilisation: string | null;

  qr_code: string;

  cle_achat?: string;
  cle_finale?: string;
}

/**
 * Pagination Django REST Framework
 */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface EBilletCreatePayload {
  utilisateur: number;
  offre: number;
  prix_paye?: number;
  statut?: BilletStatus;
}

export interface EBilletUpdatePayload {
  utilisateur?: number;
  offre?: number;
  prix_paye?: number;
  statut?: BilletStatus;
  date_utilisation?: string | null;
  lieu_utilisation?: string | null;
}