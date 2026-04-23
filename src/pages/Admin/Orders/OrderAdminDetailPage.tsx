// src/pages/Admin/Orders/OrderAdminDetailPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Order } from "@/types/orders";
import { getOrder, payOrder } from "@/api/orders.api";
import "@/styles/admin.css";

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

export default function OrderAdminDetailPage() {
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
      const updated = await payOrder(order.id, { reference_paiement: `ADMIN-MOCK-${order.numero_commande}` });
      setOrder(updated);
    } catch (e: any) {
      const msg = e?.response?.data?.detail;
      setError(msg ? String(msg) : "Paiement impossible.");
    } finally {
      setPaying(false);
    }
  }

  if (loading) return <div className="admin-table-state">Chargement…</div>;

  if (!order) {
    return (
      <div className="admin-page">
        <div className="admin-alert">{error ?? "Commande introuvable."}</div>
        <Link className="admin-btn admin-btn--ghost" to="/admin/commandes">← Retour</Link>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div style={{ marginBottom: "1rem" }}>
        <div className="admin-title">Détail commande</div>
        <div className="admin-subtitle">{order.numero_commande}</div>
      </div>

      {error && <div className="admin-alert" style={{ marginBottom: "1rem" }}>{error}</div>}

      <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <button className="admin-btn admin-btn--ghost" onClick={() => navigate(-1)}>← Retour</button>
        <button className="admin-btn" onClick={onPay} disabled={!canPay || paying}>
          {paying ? "Paiement…" : "Payer (mock)"}
        </button>
        <Link className="admin-btn admin-btn--ghost" to="/admin/billets">
          Voir Billets
        </Link>
      </div>

      <div className="admin-table-wrap" style={{ padding: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <div className="admin-text-muted">Utilisateur</div>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>{order.utilisateur_nom}</div>

            <div className="admin-text-muted">Statut</div>
            <div style={{ marginBottom: 10 }}>{order.statut}</div>

            <div className="admin-text-muted">Total</div>
            <div style={{ marginBottom: 10 }}>{fmtMoney(order.total)}</div>
          </div>

          <div>
            <div className="admin-text-muted">Créée</div>
            <div style={{ marginBottom: 10 }}>{fmtDate(order.date_creation)}</div>

            <div className="admin-text-muted">Payée</div>
            <div style={{ marginBottom: 10 }}>{fmtDate(order.date_paiement)}</div>

            <div className="admin-text-muted">Référence</div>
            <div>{order.reference_paiement ?? "—"}</div>
          </div>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <div className="admin-text-muted" style={{ marginBottom: 8 }}>Lignes</div>
          <div style={{ display: "grid", gap: "0.6rem" }}>
            {order.lignes.map((l) => (
              <div key={l.id} style={{ border: "1px solid rgba(15,23,42,0.12)", borderRadius: 12, padding: "0.75rem 1rem" }}>
                <div style={{ fontWeight: 800 }}>{l.offre_nom}</div>
                <div className="admin-text-muted" style={{ marginTop: 4 }}>
                  Quantité: {l.quantite} — PU: {fmtMoney(l.prix_unitaire)} — Sous-total: {fmtMoney(l.sous_total)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}