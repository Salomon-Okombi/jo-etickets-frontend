import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Order, OrderStatus } from "@/types/orders";
import { listOrders, unwrapOrders } from "@/api/orders.api";
import "@/styles/admin.css";

type StatusFilter = "" | "EN_ATTENTE" | "PAYEE" | "ANNULEE";
type OrderingValue = "-date_creation" | "date_creation" | "-total" | "total" | "numero_commande" | "-numero_commande";

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

function badgeClass(statut: OrderStatus) {
  const s = (statut || "").toUpperCase();
  if (s === "PAYEE") return "admin-badge admin-badge--ok";
  if (s === "EN_ATTENTE") return "admin-badge admin-badge--warn";
  if (s === "ANNULEE") return "admin-badge admin-badge--danger";
  return "admin-badge admin-badge--muted";
}

export default function OrdersAdminListPage() {
  const [rows, setRows] = useState<Order[]>([]);
  const [count, setCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [ordering, setOrdering] = useState<OrderingValue>("-date_creation");

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count, pageSize]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const params: Record<string, any> = { page, page_size: pageSize, ordering };
        if (search) params.search = search;
        if (statusFilter) params.statut = statusFilter;

        const data = await listOrders(params as any);
        if (controller.signal.aborted) return;

        const u = unwrapOrders(data);
        setRows(u.rows);
        setCount(u.count);
      } catch (e: any) {
        if (isCanceledError(e) || controller.signal.aborted) return;
        setError("Chargement des commandes impossible.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [page, pageSize, search, statusFilter, ordering]);

  return (
    <div className="admin-page">
      <div style={{ marginBottom: "1.2rem" }}>
        <div className="admin-title">Commandes</div>
        <div className="admin-subtitle">
          Suivi des commandes (en attente / payées / annulées).{" "}
          <span className="admin-text-muted">{count.toLocaleString("fr-FR")} commande(s)</span>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      <div className="admin-table-wrap" style={{ marginTop: "1rem" }}>
        <div className="admin-table-head">
          <div>
            <div className="admin-table-title">Liste des commandes</div>
            <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginTop: "0.15rem" }}>
              Recherche + filtre statut + tri + pagination
            </div>
          </div>

          <div className="admin-table-tools">
            <input
              className="admin-input"
              placeholder="Recherche (numéro, email...)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />

            <select className="admin-select" value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value as any); }}>
              <option value="">Tous statuts</option>
              <option value="EN_ATTENTE">EN_ATTENTE</option>
              <option value="PAYEE">PAYEE</option>
              <option value="ANNULEE">ANNULEE</option>
            </select>

            <select className="admin-select" value={ordering} onChange={(e) => { setPage(1); setOrdering(e.target.value as any); }}>
              <option value="-date_creation">Création (récent)</option>
              <option value="date_creation">Création (ancien)</option>
              <option value="-total">Total (desc)</option>
              <option value="total">Total (asc)</option>
              <option value="numero_commande">Numéro (A→Z)</option>
              <option value="-numero_commande">Numéro (Z→A)</option>
            </select>

            <select className="admin-select" value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="admin-table-state">Chargement…</div>
        ) : rows.length === 0 ? (
          <div className="admin-table-state">Aucune commande.</div>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Utilisateur</th>
                  <th className="admin-td-center">Statut</th>
                  <th className="admin-td-right">Total</th>
                  <th>Dates</th>
                  <th className="admin-td-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 800 }}>{o.numero_commande}</td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{o.utilisateur_nom}</div>
                      <div className="admin-td-muted" style={{ fontSize: "0.82rem", marginTop: 3 }}>
                        user_id: {o.utilisateur}
                      </div>
                    </td>
                    <td className="admin-td-center">
                      <span className={badgeClass(o.statut)}>{o.statut}</span>
                    </td>
                    <td className="admin-td-right">{fmtMoney(o.total)}</td>
                    <td className="admin-td-muted">
                      Créée: {fmtDate(o.date_creation)}
                      <br />
                      Payée: {fmtDate(o.date_paiement)}
                    </td>
                    <td className="admin-td-right">
                      <Link className="admin-btn admin-btn--xs" to={`/admin/commandes/${o.id}`}>
                        Détail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="admin-table-footer">
              <div className="admin-table-footer__text">
                {count.toLocaleString("fr-FR")} commande(s) — page {page} / {totalPages}
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="admin-btn admin-btn--sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>←</button>
                <button className="admin-btn admin-btn--sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>→</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}