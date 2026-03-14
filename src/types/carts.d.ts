export interface CartLine {
  id: number;
  offre: number;
  quantite: number;
  prix_unitaire?: number | string;
  sous_total?: number | string;
  date_ajout?: string;
}

export interface Cart {
  id: number;
  statut: string;
  montant_total?: number | string;
  lignes: CartLine[];
}