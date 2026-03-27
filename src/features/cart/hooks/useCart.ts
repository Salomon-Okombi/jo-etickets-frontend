import { useCallback, useEffect, useMemo, useState } from "react";

import type { Cart, CartLine } from "@/types/carts";
import {
  addToCart,
  getActiveCart,
  removeCartLine,
  decreaseLine as apiDecreaseLine,
  increaseLine as apiIncreaseLine,
} from "@/api/carts.api";

type Status = "idle" | "loading" | "success" | "error";

export function useCart() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const isLoading = status === "loading";

  /* =========================
     Refresh panier
  ========================= */

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

  /* =========================
     Calcul total (local)
  ========================= */

  const total = useMemo(() => {
    if (!cart) return 0;
    return cart.lignes.reduce(
      (sum, l) =>
        sum + Number(l.prix_unitaire ?? 0) * Number(l.quantite),
      0
    );
  }, [cart]);

  /* =========================
     Actions
  ========================= */

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

  const increaseLine = useCallback(
    async (line: CartLine) => {
      await apiIncreaseLine(line);
      await refresh();
    },
    [refresh]
  );

  const decreaseLine = useCallback(
    async (line: CartLine) => {
      if (!cart) return;
      await apiDecreaseLine(cart.id, line);
      await refresh();
    },
    [cart, refresh]
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
  };
}

export type UseCartReturn = ReturnType<typeof useCart>;