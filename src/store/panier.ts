import { create } from "zustand";
import { api } from "@/utils/http";

type PanierItem = {
  id: number;
  offre: number;
  offre_nom: string;
  offre_prix: string;
  devise: string;
  evenement_titre: string;
  evenement_slug: string;
  quantite: number;
};

type Panier = {
  id: number;
  items: PanierItem[];
  updated_at: string;
};

type State = {
  panier: Panier | null;
  loading: boolean;
  error: string | null;
  fetchPanier: () => Promise<void>;
  addItem: (offerId: number, qty: number) => Promise<void>;
};

export const usePanier = create<State>((set) => ({
  panier: null,
  loading: false,
  error: null,

  fetchPanier: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get<Panier>("/paniers/public/");
      set({ panier: res.data, loading: false });
    } catch {
      set({ loading: false, error: "Impossible de charger le panier." });
    }
  },

  addItem: async (offerId: number, qty: number) => {   // ✅ Type ajouté ici
    set({ loading: true, error: null });
    try {
      const res = await api.post<Panier>("/paniers/public/items/", {
        offer_id: offerId,
        qty,
      });
      set({ panier: res.data, loading: false });
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? "Erreur lors de l’ajout au panier.";
      set({ loading: false, error: msg });
      throw e;
    }
  },
}));