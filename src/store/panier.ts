//src/store/panier.ts
import { create } from "zustand";
import api from "@/utils/http";

/* =========================
   TYPES
========================= */

export type PanierItem = {
  id: number;
  offre: number;
  offre_nom: string;
  offre_prix: string;
  devise: string;
  evenement_titre: string;
  evenement_slug: string;
  quantite: number;
};

export type Panier = {
  id: number;
  items: PanierItem[];
  updated_at: string;
};

type State = {
  panier: Panier | null;
  loading: boolean;
  error: string | null;

  fetchPanier: () => Promise<void>;
  addItem: (offerId: number, qty?: number) => Promise<void>;
};

/* =========================
   STORE
========================= */

export const usePanier = create<State>((set) => ({
  panier: null,
  loading: false,
  error: null,

  fetchPanier: async () => {
    set({ loading: true, error: null });

    try {
      const { data } = await api.get<Panier>("/paniers/public/");
      set({ panier: data, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: "Impossible de charger le panier.",
      });
    }
  },

  addItem: async (offerId: number, qty: number = 1) => {
    set({ loading: true, error: null });

    try {
      const { data } = await api.post<Panier>("/paniers/public/items/", {
        offer_id: offerId,
        qty,
      });

      set({ panier: data, loading: false });
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ??
        "Erreur lors de l’ajout au panier.";

      set({ loading: false, error: message });
      throw error;
    }
  },
}));