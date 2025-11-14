export type PaymentStatus = "ATTENTE" | "PAYE" | "ECHOUE" | "REMBOURSE";

export interface Order {
  id: number;
  utilisateur: number;
  panier: number;
  numero_commande: string;
  date_commande: string;            // ISO datetime
  montant_total: string;            // ex: "500.00"
  statut_paiement: PaymentStatus;
  methode_paiement: string | null;
  reference_paiement: string | null;
  date_paiement: string | null;     // ISO datetime
}

export interface PayOrderPayload {
  methode_paiement?: string;
  reference_paiement?: string;
}

export interface CreateOrderPayload {
  panier: number;
}

export interface OrderWithCart extends Order {
  panier_detail?: {
    id: number;
    statut: "ACTIF" | "VALIDE" | "ABANDONNE" | "EXPIRE";
    montant_total: string;
    lignes: Array<{
      id: number;
      offre: number;
      offre_nom?: string;
      offre_prix?: string;
      quantite: number;
      prix_unitaire: string;
      sous_total: string;
      date_ajout: string;
    }>;
    date_creation: string;
    date_expiration: string | null;
  };
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
