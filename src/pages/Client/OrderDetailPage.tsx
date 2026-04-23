//src/pages/Client/OrderDetailPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Order } from "@/types/orders";
import { getOrder, payOrder } from "@/api/orders.api";

function isCanceledError(err: any) {
  return err?.code === "ERR_CANCELED" || err?.name === "CanceledError";
}

function fmtMoney(v: number | string) {
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function fmtDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR");
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPay = useMemo(() => (order?.statut || "").toUpperCase() === "EN_ATTENTE", [order]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getOrder(orderId);
        if (controller.signal.aborted) return;
        setOrder(data);
      } catch (e: any) {
        if (isCanceledError(e) || controller.signal.aborted) return;
        setError("Impossible de charger la commande.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    if (Number.isFinite(orderId) && orderId > 0) load();
    return () => controller.abort();
  }, [orderId]);

  async function onPay() {
    if (!order) return;
    setPaying(true);
    setError(null);

    try {
      const updated = await payOrder(order.id, { reference_paiement: `MOCK-${order.numero_commande}` });
      setOrder(updated);
    } catch (e: any) {
      const msg = e?.response?.data?.detail;
      setError(msg ? String(msg) : "Paiement impossible.");
    } finally {
      setPaying(false);
    }
  }

  if (loading) return <div style={{ padding: "2rem" }}>Chargement…</div>;
  if (!order) return <div style={{ padding: "2rem" }}>{error ?? "Commande introuvable."}</div>;

  return (
    <div style={{ padding: "1.5rem" }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: "1rem" }}>← Retour</button>

      <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>{order.numero_commande}</h1>

      <div style={{ opacity: 0.8, marginTop: 6 }}>
        Statut: <strong>{order.statut}</strong> — Total: <strong>{fmtMoney(order.total)}</strong>
      </div>

      <div style={{ opacity: 0.7, marginTop: 6 }}>
        Créée: {fmtDate(order.date_creation)} — Payée: {fmtDate(order.date_paiement)} — Réf: {order.reference_paiement ?? "—"}
      </div>

      {error && (
        <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", border: "1px solid rgba(220,38,38,0.35)", background: "rgba(220,38,38,0.08)", borderRadius: 12 }}>
          {error}
        </div>
      )}

      <h2 style={{ marginTop: "1.2rem", fontSize: "1.2rem", fontWeight: 800 }}>Lignes</h2>

      <div style={{ marginTop: "0.6rem", display: "grid", gap: "0.6rem" }}>
        {order.lignes.map((l) => (
          <div key={l.id} style={{ border: "1px solid rgba(15,23,42,0.12)", borderRadius: 12, padding: "0.75rem 1rem" }}>
            <div style={{ fontWeight: 800 }}>{l.offre_nom}</div>
            <div style={{ opacity: 0.8, marginTop: 4 }}>
              Quantité: {l.quantite} — PU: {fmtMoney(l.prix_unitaire)} — Sous-total: {fmtMoney(l.sous_total)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "1.2rem", display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
        <button onClick={onPay} disabled={!canPay || paying}>
          {paying ? "Paiement…" : "Payer (mock)"}
        </button>

        {(order.statut || "").toUpperCase() === "PAYEE" ? (
          <Link to="/mon-espace/billets" style={{ textDecoration: "none" }}>
            Voir mes billets
          </Link>
        ) : null}
      </div>
    </div>
  );
}