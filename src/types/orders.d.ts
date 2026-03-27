/* ============================================================
   Status
============================================================ */

export type OrderStatus = "EN_ATTENTE" | "PAYEE" | "ANNULEE";

/* ============================================================
   Lignes de commande
============================================================ */

export interface OrderLine {
  id: number;
  offre: number;
  offre_nom: string;
  quantite: number;
  prix_unitaire: number | string;
  sous_total: number | string;
}

/* ============================================================
   Commande
============================================================ */

export interface Order {
  id: number;
  numero_commande: string;

  utilisateur: number;
  utilisateur_nom: string;

  statut: OrderStatus;
  total: number | string;

  date_creation: string;
  date_paiement: string | null;

  reference_paiement: string | null;

  lignes: OrderLine[];
}

/* ============================================================
   Pagination générique
============================================================ */

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/* ============================================================
   Paramètres de listing
============================================================ */

export interface OrderListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  statut?: OrderStatus | "";
}

/* ============================================================
   Création de commande
============================================================ */

export interface CreateOrderItem {
  offre: number;
  quantite: number;
}

export interface CreateOrderPayload {
  items: CreateOrderItem[];
}

/* ============================================================
   Paiement
============================================================ */

export interface PayOrderPayload {
  reference_paiement?: string;
}