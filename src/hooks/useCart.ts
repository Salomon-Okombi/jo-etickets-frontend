// src/hooks/useCart.ts
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

export default function useCart() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const isLoading = status === "loading";

  const refresh = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      // 1️⃣ On tente d'abord le panier ACTIF
      const active = await getActiveCart();
      if (active) {
        setCart(active);
      } else {
        // 2️⃣ Sinon, on récupère les paniers existants (le plus récent par ex.)
        const all = await listCarts();
        const first = Array.isArray(all) ? all[0] : (all as any).results?.[0] ?? null;
        setCart(first ?? null);

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

  const total = useMemo(
    () => (cart ? computeCartTotal(cart) : 0),
    [cart]
  );

  /** Ajoute une offre au panier (crée le panier actif si besoin côté backend) */
  const addLine = useCallback(
    async (offreId: number, quantite = 1) => {
      if (quantite <= 0) return;
      setStatus("loading");
      setError(null);
      try {
        await addToCart(offreId, quantite);
        await refresh();
      } catch (e: any) {
        setError(
          e?.response?.data?.detail ??
            e?.message ??
            "Ajout au panier impossible"
        );
        setStatus("error");
        throw e;
      }
    },
    [refresh]
  );

  /** Diminue la quantité d’une ligne : -1 (fallback si pas d’endpoint dédié) */
  const decreaseLine = useCallback(
    async (line: CartLine) => {
      if (!cart) return;
      if (line.quantite <= 1) return;

      setStatus("loading");
      setError(null);
      try {
        await deleteCartLine(cart.id, line.id);
        await addToCart(line.offre, line.quantite - 1);
        await refresh();
      } catch (e: any) {
        setError(
          e?.response?.data?.detail ??
            e?.message ??
            "Impossible de diminuer la quantité"
        );
        setStatus("error");
        throw e;
      }
    },
    [cart, refresh]
  );

  /** Augmente la quantité d’une ligne : +1 */
  const increaseLine = useCallback(
    async (line: CartLine) => {
      await addLine(line.offre, 1);
    },
    [addLine]
  );

  /** Supprime complètement une ligne du panier */
  const removeLine = useCallback(
    async (line: CartLine) => {
      if (!cart) return;
      setStatus("loading");
      setError(null);
      try {
        await deleteCartLine(cart.id, line.id);
        await refresh();
      } catch (e: any) {
        setError(
          e?.response?.data?.detail ?? e?.message ?? "Suppression impossible"
        );
        setStatus("error");
        throw e;
      }
    },
    [cart, refresh]
  );

  /** Vide totalement le panier courant */
  const clearCart = useCallback(async () => {
    if (!cart) return;
    setStatus("loading");
    setError(null);
    try {
      await deleteCart(cart.id);
      setCart(null);
      setStatus("success");
    } catch (e: any) {
      setError(
        e?.response?.data?.detail ??
          e?.message ??
          "Impossible de vider le panier"
      );
      setStatus("error");
      throw e;
    }
  }, [cart]);

  return {
    cart,
    total,
    status,
    isLoading,
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
