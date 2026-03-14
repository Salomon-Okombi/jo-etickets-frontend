import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Cart, CartLine } from "@/types/carts";
import { getActiveCart, increaseLine, decreaseLine, removeCartLine } from "@/api/carts.api";

function isCanceledError(err: any) {
  return err?.code === "ERR_CANCELED" || err?.name === "CanceledError";
}

function fmtMoney(v?: number | string) {
  if (v === undefined || v === null) return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export default function CartPage() {
  const navigate = useNavigate();

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const c = await getActiveCart();
      setCart(c);
    } catch (e: any) {
      if (isCanceledError(e)) return;
      setError("Impossible de charger le panier.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const total = useMemo(() => {
    if (!cart) return 0;
    if (cart.montant_total !== undefined) return Number(cart.montant_total) || 0;
    return cart.lignes.reduce((acc, l) => acc + (Number(l.sous_total) || 0), 0);
  }, [cart]);

  async function onPlus(line: CartLine) {
    try {
      setBusyId(line.id);
      setError(null);
      await increaseLine(line);
      await refresh();
    } catch {
      setError("Impossible d’augmenter la quantité.");
    } finally {
      setBusyId(null);
    }
  }

  async function onMinus(line: CartLine) {
    if (!cart) return;
    try {
      setBusyId(line.id);
      setError(null);
      await decreaseLine(cart.id, line);
      await refresh();
    } catch {
      setError("Impossible de diminuer la quantité.");
    } finally {
      setBusyId(null);
    }
  }

  async function onRemove(line: CartLine) {
    if (!cart) return;
    const ok = window.confirm("Supprimer cette ligne du panier ?");
    if (!ok) return;

    try {
      setBusyId(line.id);
      setError(null);
      await removeCartLine(cart.id, line.id);
      await refresh();
    } catch {
      setError("Suppression impossible.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div style={{ padding: "2rem" }}>Chargement…</div>;

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "1rem" }}>Mon panier</h1>

      {error && (
        <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", border: "1px solid rgba(220,38,38,0.35)", background: "rgba(220,38,38,0.08)", borderRadius: 12 }}>
          {error}
        </div>
      )}

      {!cart || cart.lignes.length === 0 ? (
        <div>Votre panier est vide.</div>
      ) : (
        <>
          <div style={{ display: "grid", gap: "0.8rem" }}>
            {cart.lignes.map((l) => {
              const isBusy = busyId === l.id;
              return (
                <div key={l.id} style={{ border: "1px solid rgba(15,23,42,0.12)", borderRadius: 14, padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>Offre #{l.offre}</div>
                      <div style={{ opacity: 0.8, marginTop: 4 }}>
                        PU: <strong>{fmtMoney(l.prix_unitaire)}</strong> — Total ligne: <strong>{fmtMoney(l.sous_total)}</strong>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                      <button disabled={isBusy} onClick={() => onMinus(l)}>−</button>
                      <div style={{ minWidth: 24, textAlign: "center" }}>{l.quantite}</div>
                      <button disabled={isBusy} onClick={() => onPlus(l)}>+</button>
                      <button disabled={isBusy} onClick={() => onRemove(l)}>Supprimer</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ fontWeight: 900 }}>
              Total panier : {fmtMoney(total)}
            </div>

            <button onClick={() => navigate("/mon-espace/checkout")}>
              Passer au paiement
            </button>
          </div>
        </>
      )}
    </div>
  );
}