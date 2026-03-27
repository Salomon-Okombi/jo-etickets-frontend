import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Order, OrderStatus } from "@/types/orders";
import { listOrders } from "@/api/orders.api";
import "@/styles/admin.css";

type StatusFilter = "" | "EN_ATTENTE" | "PAYEE" | "ANNULEE";
type OrderingValue =
  | "-date_creation"
  | "date_creation"
  | "-total"
  | "total"
  | "numero_commande"
  | "-numero_commande";

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
  const [ordering, setOrdering] =
    useState<OrderingValue>("-date_creation");

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(count / pageSize)),
    [count, pageSize]
  );

  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const params: Record<string, any> = {
          page,
          page_size: pageSize,
          ordering,
        };

        if (search) params.search = search;
        if (statusFilter) params.statut = statusFilter;

        const data = await listOrders(params);
        if (controller.signal.aborted) return;

        setRows(data.results);
        setCount(data.count);
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
          Suivi des commandes{" "}
          <span className="admin-text-muted">
            {count.toLocaleString("fr-FR")} commande(s)
          </span>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      <div className="admin-table-wrap">
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
                    <td>{o.numero_commande}</td>
                    <td>{o.utilisateur_nom}</td>
                    <td className="admin-td-center">
                      <span className={badgeClass(o.statut)}>
                        {o.statut}
                      </span>
                    </td>
                    <td className="admin-td-right">
                      {fmtMoney(o.total)}
                    </td>
                    <td className="admin-td-muted">
                      Créée : {fmtDate(o.date_creation)}
                      <br />
                      Payée : {fmtDate(o.date_paiement)}
                    </td>
                    <td className="admin-td-right">
                      <Link
                        className="admin-btn admin-btn--xs"
                        to={`/admin/commandes/${o.id}`}
                      >
                        Détail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="admin-table-footer">
              Page {page} / {totalPages}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}