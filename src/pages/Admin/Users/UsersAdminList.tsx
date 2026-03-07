import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listUsers } from "@/api/users.api";
import type { User } from "@/types/users";
import "@/styles/admin.css";

const PAGE_SIZES = [10, 20, 50] as const;

function formatDate(value?: string) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("fr-FR");
  } catch {
    return value;
  }
}

function badgeType(t?: string) {
  const v = (t ?? "").toUpperCase();
  if (v.includes("ADMIN")) return "admin-badge admin-badge--warn";
  if (v.includes("CLIENT")) return "admin-badge admin-badge--muted";
  return "admin-badge admin-badge--muted";
}

function badgeStatut(s?: string) {
  const v = (s ?? "").toUpperCase();
  if (v.includes("ACTIF")) return "admin-badge admin-badge--ok";
  if (v.includes("INACTIF")) return "admin-badge admin-badge--danger";
  return "admin-badge admin-badge--muted";
}

export default function UsersAdminList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page") ?? 1) || 1;
  const pageSize = Number(searchParams.get("page_size") ?? 20) || 20;
  const q = searchParams.get("q") ?? "";

  const [input, setInput] = useState(q);

  const [items, setItems] = useState<User[]>([]);
  const [count, setCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setInput(q), [q]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchUsers() {
      try {
        setLoading(true);
        setError(null);

        const data = await listUsers({
          page,
          page_size: pageSize,
          search: q.trim() || undefined,
        });

        if (controller.signal.aborted) return;

        setItems(data.results);
        setCount(data.count);
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 401) setError("Non authentifié (401). Connecte-toi.");
        else if (status === 403) setError("Accès refusé (403). Tu n'es pas admin (is_staff requis).");
        else if (status === 404) setError("Endpoint introuvable (404). Vérifie /api/utilisateurs/.");
        else setError("Chargement des utilisateurs impossible.");
        console.error("UsersAdminList error:", err);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchUsers();
    return () => controller.abort();
  }, [page, pageSize, q]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count, pageSize]);
  const safePage = useMemo(() => Math.min(Math.max(1, page), totalPages), [page, totalPages]);

  function setParam(next: { page?: number; q?: string; page_size?: number }) {
    const sp = new URLSearchParams(searchParams);

    const nextQ = (next.q ?? q).trim();
    const nextPage = next.page ?? page;
    const nextSize = next.page_size ?? pageSize;

    if (nextQ) sp.set("q", nextQ);
    else sp.delete("q");

    sp.set("page", String(nextPage));
    sp.set("page_size", String(nextSize));
    setSearchParams(sp);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setParam({ q: input, page: 1 });
  }

  return (
    <div className="admin-page">
      <div style={{ marginBottom: "1.2rem" }}>
        <div className="admin-title">Utilisateurs</div>
        <div className="admin-subtitle">
          Liste admin : username, email, type_compte, statut, date_creation.
        </div>
      </div>

      {error ? <div className="admin-alert" role="alert">{error}</div> : null}

      <div className="admin-table-wrap" style={{ marginTop: "1rem" }}>
        <div className="admin-table-head">
          <div>
            <div className="admin-table-title">Liste des utilisateurs</div>
            <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginTop: "0.15rem" }}>
              {count.toLocaleString("fr-FR")} utilisateur(s)
            </div>
          </div>

          <div className="admin-table-tools">
            <button className="admin-btn" onClick={() => setParam({ page: 1 })} disabled={loading}>
              {loading ? "…" : "Actualiser"}
            </button>

            <form onSubmit={onSubmit} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <input
                className="admin-input"
                placeholder="Recherche (username/email/type/statut)…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button className="admin-btn" type="submit" disabled={loading}>Rechercher</button>
              <button
                className="admin-btn admin-btn--ghost"
                type="button"
                onClick={() => {
                  setInput("");
                  setParam({ q: "", page: 1 });
                }}
              >
                Effacer
              </button>
            </form>

            <select className="admin-select" value={pageSize} onChange={(e) => setParam({ page_size: Number(e.target.value), page: 1 })}>
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>{s}/page</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="admin-table-state">Chargement…</div>
        ) : items.length === 0 ? (
          <div className="admin-table-state">Aucun utilisateur trouvé.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th className="admin-td-center">Type</th>
                  <th className="admin-td-center">Statut</th>
                  <th>Date création</th>
                  <th className="admin-td-right"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td style={{ fontWeight: 700 }}>{u.username}</td>
                    <td>{u.email || "—"}</td>
                    <td className="admin-td-center">
                      <span className={badgeType(u.type_compte)}>{u.type_compte ?? "—"}</span>
                    </td>
                    <td className="admin-td-center">
                      <span className={badgeStatut(u.statut)}>{u.statut ?? "—"}</span>
                    </td>
                    <td>{formatDate(u.date_creation)}</td>
                    <td className="admin-td-right">
                      <Link className="admin-btn admin-btn--sm" to={`/admin/utilisateurs/${u.id}`}>
                        Détails
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="admin-table-footer">
              <div className="admin-table-footer__text">
                {count.toLocaleString("fr-FR")} utilisateur(s) — page {safePage}/{totalPages}
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="admin-btn admin-btn--sm" disabled={safePage <= 1} onClick={() => setParam({ page: safePage - 1 })}>
                  ←
                </button>
                <button className="admin-btn admin-btn--sm" disabled={safePage >= totalPages} onClick={() => setParam({ page: safePage + 1 })}>
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