import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Order } from "@/types/orders";
import { listOrders } from "@/api/orders.api";

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

export default function OrdersListPage() {
  const [rows, setRows] = useState<Order[]>([]);
  const [count, setCount] = useState(0);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(count / pageSize)),
    [count, pageSize]
  );

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await listOrders({
          page,
          //page_size: pageSize,
        });

        if (controller.signal.aborted) return;

        setRows(data.results);
        setCount(data.count);
      } catch (e: any) {
        if (isCanceledError(e) || controller.signal.aborted) return;
        setError("Impossible de charger vos commandes.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [page, pageSize]);

  if (loading) {
    return <div style={{ padding: "2rem" }}>Chargement…</div>;
  }

  if (error) {
    return <div style={{ padding: "2rem" }}>{error}</div>;
  }

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "1rem" }}>
        Mes commandes
      </h1>

      {rows.length === 0 ? (
        <div>Aucune commande pour le moment.</div>
      ) : (
        <>
          <div style={{ display: "grid", gap: "0.8rem" }}>
            {rows.map((o) => (
              <div
                key={o.id}
                style={{
                  border: "1px solid rgba(15,23,42,0.12)",
                  borderRadius: 14,
                  padding: "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800 }}>{o.numero_commande}</div>
                    <div style={{ opacity: 0.75, marginTop: 4 }}>
                      Statut : <strong>{o.statut}</strong> — Total :{" "}
                      <strong>{fmtMoney(o.total)}</strong>
                    </div>
                    <div style={{ opacity: 0.7, marginTop: 4 }}>
                      Créée : {fmtDate(o.date_creation)} — Payée :{" "}
                      {fmtDate(o.date_paiement)}
                    </div>
                  </div>

                  <Link
                    to={`/mon-espace/commandes/${o.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    Voir
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginTop: "1rem",
              alignItems: "center",
            }}
          >
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ←
            </button>

            <div style={{ opacity: 0.8 }}>
              Page {page} / {totalPages}
            </div>

            <button
              disabled={page >= totalPages}
              onClick={() =>
                setPage((p) => Math.min(totalPages, p + 1))
              }
            >
              →
            </button>

            <select
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
          </div>
        </>
      )}
    </div>
  );
}