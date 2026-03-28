import  api  from "@/api/axiosClient";
import type { CartItem } from "./cart.types";

export async function syncLocalCartToServer(items: CartItem[]) {
  for (const it of items) {
    await api.post("/paniers/add/", { offre: it.offre, quantite: it.quantite });
  }
}