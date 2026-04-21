//src/hooks/useCart.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addToCart,
  deleteCart,
  removeCartLine,
  getActiveCart,
} from "@/api/carts.api";

import type { Cart, CartLine } from "@/types/carts";

/* ============================================================
   Types
============================================================ */

type Status = "idle" | "loading" | "success" | "error";

/* ============================================================
    HOOK PANIER
============================================================ */

export default function useCart() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const isLoading = status === "loading";

  /* ------------------------------------------------------------
     Rafraîchissement du panier
  ------------------------------------------------------------ */

  const refresh = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const active = await getActiveCart();
      setCart(active);
      setStatus("success");
    } catch (e: any) {
      setError(e?.message ?? "Impossible de charger le panier");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /* ------------------------------------------------------------
     Total panier (calcul local)
  ------------------------------------------------------------ */

  const total = useMemo(() => {
    if (!cart) return 0;
    return cart.lignes.reduce(
      (sum: number, l: CartLine) =>
        sum + Number(l.prix_unitaire ?? 0) * Number(l.quantite),
      0
    );
  }, [cart]);

  /* ------------------------------------------------------------
     Actions panier
  ------------------------------------------------------------ */

  const addLine = useCallback(
    async (offreId: number, quantite: number = 1) => {
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

  const decreaseLine = useCallback(
    async (line: CartLine) => {
      if (!cart) return;
      if (line.quantite <= 1) return;

      setStatus("loading");
      setError(null);
      try {
        await removeCartLine(cart.id, line.id);
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

  const increaseLine = useCallback(
    async (line: CartLine) => {
      await addLine(line.offre, 1);
    },
    [addLine]
  );

  const removeLine = useCallback(
    async (line: CartLine) => {
      if (!cart) return;

      setStatus("loading");
      setError(null);
      try {
        await removeCartLine(cart.id, line.id);
        await refresh();
      } catch (e: any) {
        setError(
          e?.response?.data?.detail ??
            e?.message ??
            "Suppression impossible"
        );
        setStatus("error");
        throw e;
      }
    },
    [cart, refresh]
  );

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