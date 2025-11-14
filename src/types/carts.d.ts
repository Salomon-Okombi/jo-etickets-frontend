export type CartStatus = "ACTIF" | "VALIDE" | "ABANDONNE" | "EXPIRE";

export interface CartLine {
  id: number;
  offre: number;               // ID de l’offre
  offre_nom?: string;          // fourni par certaines réponses
  offre_prix?: string;         // idem
  quantite: number;
  prix_unitaire: string;       // ex: "150.00"
  sous_total: string;          // ex: "300.00"
  date_ajout: string;          // ISO datetime
}

export interface Cart {
  id: number;
  utilisateur: number;
  statut: CartStatus;
  montant_total: string;       // ex: "450.00"
  date_creation: string;
  date_expiration: string | null;
  lignes: CartLine[];
}
