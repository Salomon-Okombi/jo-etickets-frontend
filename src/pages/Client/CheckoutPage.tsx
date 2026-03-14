import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Cart } from "@/types/carts";
import { getActiveCart } from "@/api/carts.api";
import { createOrder, payOrder } from "@/api/orders.api";
import type { Order } from "@/types/orders";

function isCanceledError(err: any) {
  return err?.code === "ERR_CANCELED" || err?.name === "CanceledError";
}

function fmtMoney(v?: number | string) {
  if (v === undefined || v === null) return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export default function CheckoutPage() {
  const navigate = useNavigate();

  const [cart, setCart] = useState<Cart | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const c = await getActiveCart();
        if (controller.signal.aborted) return;
        setCart(c);
      } catch (e: any) {
        if (isCanceledError(e) || controller.signal.aborted) return;
        setError("Impossible de charger le panier.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const canCheckout = useMemo(() => !!cart && cart.lignes.length > 0, [cart]);

  const items = useMemo(() => {
    if (!cart) return [];
    return cart.lignes.map((l) => ({ offre: l.offre, quantite: l.quantite }));
  }, [cart]);

  async function onCreateOrder() {
    if (!canCheckout) return;

    setCreating(true);
    setError(null);

    try {
      const created = await createOrder({ items });
      setOrder(created);
    } catch (e: any) {
      const msg = e?.response?.data?.detail;
      setError(msg ? String(msg) : "Création de commande impossible.");
    } finally {
      setCreating(false);
    }
  }

  async function onPayOrder() {
    if (!order) return;

    setPaying(true);
    setError(null);

    try {
      const updated = await payOrder(order.id, { reference_paiement: `MOCK-${order.numero_commande}` });
      setOrder(updated);
      navigate(`/mon-espace/commandes/${updated.id}`);
    } catch (e: any) {
      const msg = e?.response?.data?.detail;
      setError(msg ? String(msg) : "Paiement impossible.");
    } finally {
      setPaying(false);
    }
  }

  if (loading) return <div style={{ padding: "2rem" }}>Chargement…</div>;

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "1rem" }}>Paiement</h1>

      {error && (
        <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", border: "1px solid rgba(220,38,38,0.35)", background: "rgba(220,38,38,0.08)", borderRadius: 12 }}>
          {error}
        </div>
      )}

      {!cart || cart.lignes.length === 0 ? (
        <div>
          Panier vide. <Link to="/mon-espace/panier">Retour au panier</Link>
        </div>
      ) : (
        <>
          <div style={{ border: "1px solid rgba(15,23,42,0.12)", borderRadius: 14, padding: "1rem" }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Récapitulatif</div>

            <div style={{ display: "grid", gap: "0.6rem" }}>
              {cart.lignes.map((l) => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Offre #{l.offre}</div>
                    <div style={{ opacity: 0.75 }}>Quantité: {l.quantite}</div>
                  </div>
                  <div style={{ fontWeight: 900 }}>{fmtMoney(l.sous_total)}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "0.8rem", display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 900 }}>Total</div>
              <div style={{ fontWeight: 900 }}>{fmtMoney(cart.montant_total)}</div>
            </div>
          </div>

          <div style={{ marginTop: "1rem", display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
            {!order ? (
              <button onClick={onCreateOrder} disabled={!canCheckout || creating}>
                {creating ? "Création…" : "Créer la commande"}
              </button>
            ) : (
              <>
                <div style={{ padding: "0.6rem 0.9rem", border: "1px solid rgba(15,23,42,0.12)", borderRadius: 12 }}>
                  Commande: <strong>{order.numero_commande}</strong> — Statut: <strong>{order.statut}</strong>
                </div>

                <button onClick={onPayOrder} disabled={paying || (order.statut || "").toUpperCase() !== "EN_ATTENTE"}>
                  {paying ? "Paiement…" : "Payer (mock)"}
                </button>

                <Link to={`/mon-espace/commandes/${order.id}`} style={{ textDecoration: "none" }}>
                  Voir la commande
                </Link>

                <Link to="/mon-espace/billets" style={{ textDecoration: "none" }}>
                  Mes billets
                </Link>
              </>
            )}

            <Link to="/mon-espace/panier" style={{ textDecoration: "none" }}>
              Retour au panier
            </Link>
          </div>
        </>
      )}
    </div>
  );
}