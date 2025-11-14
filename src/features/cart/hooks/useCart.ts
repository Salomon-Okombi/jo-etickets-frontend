import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type Cart,
  type CartLine,
  addToCart,
  deleteCart,
  deleteCartLine,
  getActiveCart,
  listCarts,
  computeCartTotal,
} from "@/api/carts.api";

type Status = "idle" | "loading" | "success" | "error";

export function useCart() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const isLoading = status === "loading";

  const refresh = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      // On tente d'abord de récupérer le panier ACTIF
      const active = await getActiveCart();
      if (active) {
        setCart(active);
      } else {
        // Sinon, on récupère la liste (pour afficher un panier VALIDE récent, au besoin)
        const page1 = await listCarts({ page: 1 });
        setCart(page1.results?.[0] ?? null);
      }
      setStatus("success");
    } catch (e: any) {
      setError(e?.message ?? "Impossible de charger le panier");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const total = useMemo(() => (cart ? computeCartTotal(cart) : 0), [cart]);

  /** Ajoute une quantité (crée le panier ACTIF côté backend si nécessaire) */
  const addLine = useCallback(
    async (offreId: number, quantite = 1) => {
      if (quantite <= 0) return;
      setStatus("loading");
      setError(null);
      try {
        await addToCart(offreId, quantite);
        await refresh();
      } catch (e: any) {
        setError(e?.response?.data?.detail ?? e?.message ?? "Ajout au panier impossible");
        setStatus("error");
        throw e;
      } finally {
        // le refresh remettra success si tout va bien
      }
    },
    [refresh]
  );

  /**
   * Diminue la quantité d’UNE ligne (fallback sans endpoint de décrément natif) :
   * - supprime la ligne,
   * - la réinsère avec quantite - 1 si la quantité > 1.
   */
  const decreaseLine = useCallback(
    async (line: CartLine) => {
      if (!cart) return;
      if (line.quantite <= 1) return; // rien à faire (ou utiliser removeLine)

      setStatus("loading");
      setError(null);
      try {
        await deleteCartLine(cart.id, line.id);
        await addToCart(line.offre, line.quantite - 1);
        await refresh();
      } catch (e: any) {
        setError(e?.response?.data?.detail ?? e?.message ?? "Impossible de diminuer la quantité");
        setStatus("error");
        throw e;
      }
    },
    [cart, refresh]
  );

  /** Augmente la quantité d’UNE ligne (+1) */
  const increaseLine = useCallback(
    async (line: CartLine) => {
      await addLine(line.offre, 1);
    },
    [addLine]
  );

  /** Supprime complètement UNE ligne du panier */
  const removeLine = useCallback(
    async (line: CartLine) => {
      if (!cart) return;
      setStatus("loading");
      setError(null);
      try {
        await deleteCartLine(cart.id, line.id);
        await refresh();
      } catch (e: any) {
        setError(e?.response?.data?.detail ?? e?.message ?? "Suppression impossible");
        setStatus("error");
        throw e;
      }
    },
    [cart, refresh]
  );

  /** Vide totalement le panier courant (DELETE /paniers/{id}/) */
  const clearCart = useCallback(async () => {
    if (!cart) return;
    setStatus("loading");
    setError(null);
    try {
      await deleteCart(cart.id);
      setCart(null);
      setStatus("success");
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e?.message ?? "Impossible de vider le panier");
      setStatus("error");
      throw e;
    }
  }, [cart]);

  return {
    cart,
    total,
    isLoading,
    status,
    error,
    refresh,

    addLine,
    increaseLine,
    decreaseLine,
    removeLine,
    clearCart,
  };
}

export type UseCartReturn = ReturnType<typeof useCart>;
