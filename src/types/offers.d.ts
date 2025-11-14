export type OfferType = "SOLO" | "DUO" | "FAMILLE" | "VIP" | string;

export interface Offer {
  id: number;
  evenement: number;            // ID de l’événement
  nom_offre: string;
  description: string | null;
  prix: number;                 // nombre côté front
  nb_personnes: number;
  type_offre: OfferType;
  stock_total: number;
  stock_disponible: number;
  date_debut_vente?: string | null; // ISO datetime
  date_fin_vente?: string | null;   // ISO datetime
}

export type CreateOfferPayload = Omit<Offer, "id" | "stock_disponible">;
export type UpdateOfferPayload = Partial<CreateOfferPayload>;

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
