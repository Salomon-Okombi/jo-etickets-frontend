export type OrderStatus = "EN_ATTENTE" | "PAYEE" | "ANNULEE" | string;

export interface OrderLine {
  id: number;
  offre: number;
  offre_nom: string;
  quantite: number;
  prix_unitaire: number | string;
  sous_total: number | string;
}

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

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface OrderListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  statut?: OrderStatus | "";
}

export interface CreateOrderItem {
  offre: number;
  quantite: number;
}

export interface CreateOrderPayload {
  items: CreateOrderItem[];
}

export interface PayOrderPayload {
  reference_paiement?: string;
}