import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { CartItem } from "./cart.types";
import { clearCartStorage, countItems, loadCart, saveCart } from "./cart.storage";
import api from "@/api/axiosClient";
import useAuth from "@/hooks/useAuth";
import { priceToCents } from "./money";

type CartContextValue = {
  items: CartItem[];
  count: number;
  addItem: (item: { offre: number; quantite: number; nom_offre?: string; nb_personnes?: number; prix: number | string }) => void;
  removeItem: (offreId: number) => void;
  setQty: (offreId: number, qty: number) => void;
  clear: () => void;

  syncToServer: () => Promise<void>;
  syncing: boolean;
};

export const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  const [items, setItems] = useState<CartItem[]>(() => loadCart());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => saveCart(items), [items]);

  const count = useMemo(() => countItems(items), [items]);

  const addItem = useCallback((item: { offre: number; quantite: number; nom_offre?: string; nb_personnes?: number; prix: number | string }) => {
    const prix_centimes = priceToCents(item.prix);
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.offre === item.offre);
      if (idx === -1) {
        return [...prev, { offre: item.offre, quantite: Math.max(1, item.quantite || 1), nom_offre: item.nom_offre, nb_personnes: item.nb_personnes, prix_centimes }];
      }
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        quantite: copy[idx].quantite + (item.quantite || 1),
        nom_offre: item.nom_offre ?? copy[idx].nom_offre,
        nb_personnes: item.nb_personnes ?? copy[idx].nb_personnes,
        prix_centimes: prix_centimes || copy[idx].prix_centimes,
      };
      return copy;
    });
  }, []);

  const removeItem = useCallback((offreId: number) => {
    setItems((prev) => prev.filter((x) => x.offre !== offreId));
  }, []);

  const setQty = useCallback((offreId: number, qty: number) => {
    setItems((prev) => prev.map((x) => (x.offre === offreId ? { ...x, quantite: Math.max(1, qty) } : x)));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    clearCartStorage();
  }, []);

  const syncToServer = useCallback(async () => {
    if (!isAuthenticated) return;
    if (items.length === 0) return;

    setSyncing(true);
    try {
      await api.post("/paniers/sync/", { items: items.map((it) => ({ offre: it.offre, quantite: it.quantite })) });
      setItems([]);
      clearCartStorage();
    } finally {
      setSyncing(false);
    }
  }, [isAuthenticated, items]);

  return (
    <CartContext.Provider value={{ items, count, addItem, removeItem, setQty, clear, syncToServer, syncing }}>
      {children}
    </CartContext.Provider>
  );
}