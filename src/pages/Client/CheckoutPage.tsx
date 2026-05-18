import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getActiveServerCart } from "@/api/paniers.server.api";
import { createOrder } from "@/api/orders.api";
import { initPaiement, confirmPaiement } from "@/api/paiements.api";
import "@/styles/checkout.css";

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
  const [error, setError] = useState<string | null>(null);

  // Données paiement mock
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
        setError("Impossible de charger votre panier pour le paiement.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const items = useMemo(() => {
    if (!serverCart) return [];
    return (serverCart.lignes || []).map((l: any) => ({
      offre: l.offre,
      quantite: l.quantite,
    }));
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
      setError(e?.response?.data?.detail ?? "Création de la réservation impossible.");
    } finally {
      setCreating(false);
    }
  }

  async function onPay() {
    if (!order) return;
    if (!cardName || !cardNumber || !cardExp || !cardCvc) {
      setError("Merci de renseigner toutes les informations de paiement.");
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

      await confirmPaiement(p.id, {
        success,
        reference_paiement: `MOCK-${order.numero_commande}`,
        raw_payload: { success },
      });

      navigate(`/mon-espace/commandes/${order.id}`);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Le paiement a échoué.");
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return <div className="checkout-page__state">Chargement du paiement…</div>;
  }

  if (!serverCart || (serverCart.lignes || []).length === 0) {
    return (
      <div className="checkout-page">
        <p>Votre panier est vide.</p>
        <Link to="/evenements">→ Revenir aux événements</Link>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h1 className="checkout-title">🎫 Finaliser votre réservation</h1>
      <p className="checkout-subtitle">
        Paiement sécurisé · Billets officiels · Accès garanti
      </p>

      <div className="checkout-total">
        Total à payer : <strong>{fmtMoney(serverCart.montant_total)}</strong>
      </div>

      {error && <div className="checkout-error">{error}</div>}

      {/* RÉCAP */}
      <div className="checkout-box">
        <h2 className="checkout-section-title">🧾 Récapitulatif</h2>

        {serverCart.lignes.map((l: any) => (
          <div key={l.id} className="checkout-line">
            <span>Billets — Offre #{l.offre}</span>
            <strong>x{l.quantite} · {fmtMoney(l.sous_total)}</strong>
          </div>
        ))}

        <div className="checkout-line checkout-line--total">
          <span>Total</span>
          <strong>{fmtMoney(serverCart.montant_total)}</strong>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="checkout-actions">
        {!order ? (
          <button className="checkout-btn" onClick={onCreateOrder} disabled={creating}>
            {creating ? "Création de la réservation…" : "Créer la réservation"}
          </button>
        ) : (
          <div className="checkout-order-ref">
            Réservation <strong>{order.numero_commande}</strong>
          </div>
        )}

        <Link to="/mon-espace/panier" className="checkout-link">
          ← Modifier ma sélection
        </Link>
      </div>

      {/* PAIEMENT */}
      {order && (
        <div className="checkout-box">
          <h2 className="checkout-section-title">💳 Paiement sécurisé (simulation)</h2>

          <div className="checkout-form">
            <input placeholder="Nom sur la carte" value={cardName} onChange={(e) => setCardName(e.target.value)} />
            <input placeholder="Numéro de carte" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
            <input placeholder="MM/AA" value={cardExp} onChange={(e) => setCardExp(e.target.value)} />
            <input placeholder="CVC" value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} />
          </div>

          <label className="checkout-checkbox">
            <input type="checkbox" checked={success} onChange={(e) => setSuccess(e.target.checked)} />
            Paiement réussi (mock)
          </label>

          <button className="checkout-btn checkout-btn--primary" onClick={onPay} disabled={paying}>
            {paying ? "Paiement en cours…" : "Confirmer le paiement"}
          </button>
        </div>
      )}
    </div>
  );
}