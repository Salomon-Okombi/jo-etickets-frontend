//features/cart/cart.types.ts
export interface CartItem {
  offre: number;
  quantite: number;
  nom_offre?: string;
  nb_personnes?: number;
  prix_centimes: number; // prix unitaire
}