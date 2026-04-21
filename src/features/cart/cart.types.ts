//features/cart/cart.types.ts
export interface CartItem {
  offre: number;
  quantite: number;
  nom_offre?: string;
  prix?: number | string;
  nb_personnes?: number;
}