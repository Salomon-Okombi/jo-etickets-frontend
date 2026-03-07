import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/axiosClient";
import useToast from "@/hooks/useToast";
import "@/styles/admin.css";

/**
 * Page Admin : Commandes
 * - Liste + recherche + filtre statut + pagination
 * - Compatible endpoints backend variables (orders/commandes)
 */

type OrderStatus = "PAYEE" | "EN_ATTENTE" | "ANNULEE" | "REMBOURSEE" | string;

type Order = {
  id: number;
  numero?: string;

  utilisateur?: number;
  utilisateur_nom?: string;

  total?: number | string;
  montant?: number | string;

  statut?: OrderStatus;
  status?: OrderStatus;

  created_at?: string;
  date_creation?: string;
};

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

function normalizeStatus(o: Order): string {
  return (o.statut ?? o.status ?? "—").toString();
}

function normalizeTotal(o: Order): string {
  const v = o.total ?? o.montant;
  if (v === undefined || v === null) return "—";
  const num = typeof v === "string" ? Number(v) : v;
  if (Number.isFinite(num)) return num.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  return String(v);
}

function normalizeDate(o: Order): string {
  const d = o.created_at ?? o.date_creation;
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("fr-FR");
  } catch {
    return d;
  }
}

function statusBadge(status: string) {
  const s = status.toUpperCase();
  if (["PAYEE", "PAID", "SUCCES", "SUCCESS"].includes(s)) return "admin-badge admin-badge--ok";
  if (["EN_ATTENTE", "PENDING"].includes(s)) return "admin-badge admin-badge--warn";
  if (["ANNULEE", "CANCELED", "CANCELLED", "REMBOURSEE", "REFUNDED"].includes(s)) return "admin-badge admin-badge--danger";
  return "admin-badge admin-badge--muted";
}

async function fetchWithFallback<T>(paths: string[], params: any, signal: AbortSignal) {
  let lastErr: any = null;

  for (const path of paths) {
    try {
      const { data } = await api.get<T>(path, { params, signal });
      return { data, usedPath: path };
    } catch (err: any) {
      lastErr = err;
      // si 404, on tente le prochain endpoint
      const status = err?.response?.status;
      if (status === 404) continue;
      // autre erreur = on stop
      throw err;
    }
  }

  throw lastErr ?? new Error("Aucun endpoint Orders valide trouvé.");
}

export default function OrdersAdminListPage() {
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersCount, setOrdersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<string>("");

  const [endpointUsed, setEndpointUsed] = useState<string>("");

  // debounce recherche
  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchOrders() {
      try {
        setLoading(true);
        setError(null);

        const params: Record<string, string | number> = { page, page_size: pageSize };
        if (search) params.search = search;
        if (statusFilter) params.statut = statusFilter; // côté backend, ça peut être "status" -> on test aussi en fallback plus bas

        const endpoints = [
          "/orders/",
          "/commandes/",
          "/paiements/orders/",
          "/paiements/commandes/",
        ];

        // try #1 : statut via "statut"
        try {
          const res = await fetchWithFallback<Paginated<Order>>(endpoints, params, controller.signal);
          setEndpointUsed(res.usedPath);
          setOrders(res.data.results);
          setOrdersCount(res.data.count);
          return;
        } catch (e: any) {
          // try #2 : statut via "status"
          if (statusFilter) {
            const params2 = { ...params };
            delete (params2 as any).statut;
            (params2 as any).status = statusFilter;

            const res2 = await fetchWithFallback<Paginated<Order>>(endpoints, params2, controller.signal);
            setEndpointUsed(res2.usedPath);
            setOrders(res2.data.results);
            setOrdersCount(res2.data.count);
            return;
          }
          throw e;
        }
      } catch (err: any) {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
        console.error("Admin Orders: fetch error =", err);
        setError("Chargement des commandes impossible.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
    return () => controller.abort();
  }, [page, pageSize, search, statusFilter]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(ordersCount / pageSize)), [ordersCount, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  async function copyText(text: string, label = "Copié") {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} ✅`, "success");
    } catch {
      showToast("Impossible de copier (permissions navigateur).", "error");
    }
  }

  return (
    <div className="admin-page">
      <div style={{ marginBottom: "1.2rem" }}>
        <div className="admin-title">Commandes</div>
        <div className="admin-subtitle">
          Liste des commandes/paiements : statut, montant, utilisateur.{" "}
          <span className="admin-text-muted" style={{ fontSize: "0.85rem" }}>
            {endpointUsed ? `Endpoint utilisé : ${endpointUsed}` : ""}
          </span>
        </div>
      </div>

      {error ? (
        <div className="admin-alert" role="alert">
          {error}
        </div>
      ) : null}

      <div className="admin-table-wrap" style={{ marginTop: "1rem" }}>
        <div className="admin-table-head">
          <div>
            <div className="admin-table-title">Liste des commandes</div>
            <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginTop: "0.15rem" }}>
              {ordersCount.toLocaleString("fr-FR")} commande(s) au total
            </div>
          </div>

          <div className="admin-table-tools">
            <input
              className="admin-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Recherche (id, numéro, utilisateur)"
            />

            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(e.target.value);
              }}
            >
              <option value="">Tous statuts</option>
              <option value="PAYEE">PAYÉE</option>
              <option value="EN_ATTENTE">EN ATTENTE</option>
              <option value="ANNULEE">ANNULÉE</option>
              <option value="REMBOURSEE">REMBOURSÉE</option>
            </select>

            <select
              className="admin-select"
              value={pageSize}
              onChange={(e) => {
                setPage(1);
                setPageSize(Number(e.target.value));
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>

            <button
              className="admin-btn"
              onClick={() => {
                setPage(1);
                setSearch(searchInput.trim());
              }}
            >
              Appliquer
            </button>
          </div>
        </div>

        {loading ? (
          <div className="admin-table-state">Chargement…</div>
        ) : orders.length === 0 ? (
          <div className="admin-table-state">Aucune commande trouvée.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Utilisateur</th>
                  <th>Statut</th>
                  <th>Montant</th>
                  <th>Date</th>
                  <th className="admin-td-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((o) => {
                  const status = normalizeStatus(o);
                  const userLabel = o.utilisateur_nom ?? (o.utilisateur ? `Utilisateur #${o.utilisateur}` : "—");
                  const orderNumber = o.numero ?? String(o.id);

                  return (
                    <tr key={o.id}>
                      <td>{orderNumber}</td>
                      <td>{userLabel}</td>
                      <td>
                        <span className={statusBadge(status)}>{status}</span>
                      </td>
                      <td>{normalizeTotal(o)}</td>
                      <td>{normalizeDate(o)}</td>
                      <td className="admin-td-right">
                        {/* Ajuste cette route si tu as un détail admin commande */}
                        <Link
                          className="admin-btn admin-btn--sm"
                          to={`/admin/commandes/${o.id}`}
                          style={{ marginRight: "0.4rem" }}
                        >
                          Détails
                        </Link>

                        <button className="admin-btn admin-btn--sm" onClick={() => copyText(String(o.id), "ID copié")}>
                          Copier ID
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="admin-table-footer">
              <div className="admin-table-footer__text">
                {ordersCount.toLocaleString("fr-FR")} commande(s) — page {page} / {totalPages}
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="admin-btn admin-btn--sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  ←
                </button>
                <button
                  className="admin-btn admin-btn--sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}