//src/pages/Client/CheckoutPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getActiveServerCart } from "@/api/paniers.server.api";
import { createOrder } from "@/api/orders.api";
import { initPaiement, confirmPaiement } from "@/api/paiements.api";

function fmtMoney(v?: number | string) {
  if (v === undefined || v === null) return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export default function CheckoutPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [serverCart, setServerCart] = useState<any>(null);

  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState(false);

  const [order, setOrder] = useState<any>(null);
  const [paiement, setPaiement] = useState<any>(null);

  const [error, setError] = useState<string | null>(null);

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [success, setSuccess] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const cart = await getActiveServerCart();
        setServerCart(cart);
      } catch {
        setError("Impossible de charger le panier serveur.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const items = useMemo(() => {
    if (!serverCart) return [];
    return (serverCart.lignes || []).map((l: any) => ({ offre: l.offre, quantite: l.quantite }));
  }, [serverCart]);

  const canCreateOrder = items.length > 0;

  async function onCreateOrder() {
    if (!canCreateOrder) return;
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

  async function onPay() {
    if (!order) return;

    if (!cardName.trim() || !cardNumber.trim() || !cardExp.trim() || !cardCvc.trim()) {
      setError("Merci de renseigner les informations bancaires (mock).");
      return;
    }

    setPaying(true);
    setError(null);

    try {
      const p = await initPaiement({
        commande: order.id,
        provider: "MOCK",
        raw_payload: {
          cardName,
          cardNumberMasked: cardNumber.replace(/\d(?=\d{4})/g, "*"),
          exp: cardExp,
          cvcMasked: "***",
        },
      });
      setPaiement(p);

      await confirmPaiement(p.id, {
        success,
        reference_paiement: `MOCK-${order.numero_commande}`,
        raw_payload: { success },
      });

      navigate(`/mon-espace/commandes/${order.id}`);
    } catch (e: any) {
      const msg = e?.response?.data?.detail;
      setError(msg ? String(msg) : "Paiement impossible.");
    } finally {
      setPaying(false);
    }
  }

  if (loading) return <div style={{ padding: "2rem" }}>Chargement…</div>;

  if (!serverCart || (serverCart.lignes || []).length === 0) {
    return (
      <div style={{ padding: "2rem" }}>
        {error ? <div style={{ color: "#b42318" }}>{error}</div> : null}
        <div>Votre panier serveur est vide.</div>
        <Link to="/offres">Retour aux offres</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: 900 }}>Paiement</h1>
      <div style={{ opacity: 0.8, marginTop: 6 }}>
        Total panier : <strong>{fmtMoney(serverCart.montant_total)}</strong>
      </div>

      {error ? (
        <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", border: "1px solid rgba(220,38,38,0.35)", background: "rgba(220,38,38,0.08)", borderRadius: 12 }}>
          {error}
        </div>
      ) : null}

      <div style={{ marginTop: "1rem", border: "1px solid rgba(15,23,42,0.12)", borderRadius: 14, padding: "1rem" }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Récapitulatif</div>
        <div style={{ display: "grid", gap: "0.6rem" }}>
          {serverCart.lignes.map((l: any) => (
            <div key={l.id} style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
              <div style={{ fontWeight: 700 }}>Offre #{l.offre}</div>
              <div style={{ fontWeight: 900 }}>
                x{l.quantite} — {fmtMoney(l.sous_total)}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "0.8rem", display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 900 }}>Total</div>
          <div style={{ fontWeight: 900 }}>{fmtMoney(serverCart.montant_total)}</div>
        </div>
      </div>

      <div style={{ marginTop: "1rem", display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
        {!order ? (
          <button onClick={onCreateOrder} disabled={!canCreateOrder || creating}>
            {creating ? "Création…" : "Créer la commande"}
          </button>
        ) : (
          <div style={{ padding: "0.6rem 0.9rem", border: "1px solid rgba(15,23,42,0.12)", borderRadius: 12 }}>
            Commande: <strong>{order.numero_commande}</strong> — Statut: <strong>{order.statut}</strong>
          </div>
        )}

        <Link to="/mon-espace/panier" style={{ textDecoration: "none" }}>
          Retour au panier
        </Link>
      </div>

      {order ? (
        <div style={{ marginTop: "1.2rem", border: "1px solid rgba(15,23,42,0.12)", borderRadius: 14, padding: "1rem" }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Informations bancaires (mock)</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
            <div>
              <div style={{ opacity: 0.7, marginBottom: 4 }}>Nom sur la carte</div>
              <input value={cardName} onChange={(e) => setCardName(e.target.value)} />
            </div>
            <div>
              <div style={{ opacity: 0.7, marginBottom: 4 }}>Numéro de carte</div>
              <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4242 4242 4242 4242" />
            </div>
            <div>
              <div style={{ opacity: 0.7, marginBottom: 4 }}>Expiration</div>
              <input value={cardExp} onChange={(e) => setCardExp(e.target.value)} placeholder="MM/AA" />
            </div>
            <div>
              <div style={{ opacity: 0.7, marginBottom: 4 }}>CVC</div>
              <input value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} placeholder="123" />
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={success} onChange={(e) => setSuccess(e.target.checked)} />
              Paiement réussi (mock)
            </label>
          </div>

          <div style={{ marginTop: "1rem", display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
            <button onClick={onPay} disabled={paying}>
              {paying ? "Paiement…" : "Valider le paiement (mock)"}
            </button>
            <Link to="/mon-espace/billets" style={{ textDecoration: "none" }}>
              Mes billets
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}