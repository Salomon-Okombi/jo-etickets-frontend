import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listUsers, deleteUser } from "@/api/users.api";
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

/**
 * Affiche toutes les clés (debug / ultra complet)
 * -> utile si tu veux vraiment "tout voir" même si le type ne contient pas tout.
 * On retire les champs déjà affichés dans les colonnes principales pour éviter doublons.
 */
function renderExtraFields(user: Record<string, any>) {
  const blacklist = new Set([
    "id",
    "username",
    "email",
    "type_compte",
    "statut",
    "date_creation",
  ]);

  const entries = Object.entries(user).filter(([k, v]) => !blacklist.has(k) && v !== null && v !== undefined);

  if (entries.length === 0) return "—";

  // On affiche de façon compacte : key=value
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
      {entries.slice(0, 6).map(([k, v]) => (
        <span key={k} className="admin-badge admin-badge--muted" title={`${k} = ${String(v)}`}>
          {k}:{String(v)}
        </span>
      ))}
      {entries.length > 6 ? (
        <span className="admin-badge admin-badge--muted" title="Champs supplémentaires non affichés">
          +{entries.length - 6}
        </span>
      ) : null}
    </div>
  );
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

  // delete state
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => setInput(q), [q]);

  async function fetchUsers(signal?: AbortSignal) {
    const data = await listUsers({
      page,
      page_size: pageSize,
      search: q.trim() || undefined,
    });

    if (signal?.aborted) return;

    setItems(data.results);
    setCount(data.count);
  }

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      try {
        setLoading(true);
        setError(null);
        await fetchUsers(controller.signal);
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 401) setError("Non authentifié (401). Connecte-toi.");
        else if (status === 403) setError("Accès refusé (403). Admin requis (is_staff).");
        else if (status === 404) setError("Endpoint introuvable (404). Vérifie le CRUD admin users.");
        else setError("Chargement des utilisateurs impossible.");
        console.error("UsersAdminList error:", err);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    run();
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

  async function onDelete(u: User) {
    const ok = window.confirm(
      `Supprimer l'utilisateur "${u.username}" (ID ${u.id}) ?\nCette action est irréversible.`
    );
    if (!ok) return;

    try {
      setDeletingId(u.id);
      setError(null);

      await deleteUser(u.id);

      // refresh list
      // si on supprime le dernier élément d'une page, on recule d'une page si possible
      const newCount = Math.max(0, count - 1);
      const newTotalPages = Math.max(1, Math.ceil(newCount / pageSize));
      if (safePage > newTotalPages) {
        setParam({ page: newTotalPages });
      } else {
        // refresh in place
        const controller = new AbortController();
        await fetchUsers(controller.signal);
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 400) setError("Suppression refusée (400) : peut-être suppression de soi-même ou super-admin.");
      else if (status === 401) setError("Non authentifié (401).");
      else if (status === 403) setError("Accès refusé (403).");
      else setError("Suppression impossible.");
      console.error("Delete user error:", err);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="admin-page">
      <div style={{ marginBottom: "1.2rem" }}>
        <div className="admin-title">Utilisateurs</div>
        <div className="admin-subtitle">
          Liste admin : username, email, type_compte, statut, date_creation (+ champs supplémentaires si présents).
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
            <div className="admin-table-title">Liste des utilisateurs</div>
            <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginTop: "0.15rem" }}>
              {count.toLocaleString("fr-FR")} utilisateur(s)
            </div>
          </div>

          <div className="admin-table-tools">
            {/* ✅ bouton créer */}
            <Link className="admin-btn" to="/admin/utilisateurs/nouveau">
              + Créer
            </Link>

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
              <button className="admin-btn" type="submit" disabled={loading}>
                Rechercher
              </button>
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

            <select
              className="admin-select"
              value={pageSize}
              onChange={(e) => setParam({ page_size: Number(e.target.value), page: 1 })}
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}/page
                </option>
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
            {/* ✅ table large scrollable */}
            <table className="admin-table" style={{ minWidth: 1100 }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th className="admin-td-center">Type</th>
                  <th className="admin-td-center">Statut</th>
                  <th>Date création</th>
                  {/* ✅ champs supplémentaires */}
                  <th>Autres champs</th>
                  {/* ✅ actions */}
                  <th className="admin-td-right">Actions</th>
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

                    {/* ✅ montre tout ce que renvoie l’API en “extra” */}
                    <td>{renderExtraFields(u as any)}</td>

                    <td className="admin-td-right">
                      {/* ✅ Modifier */}
                      <Link
                        className="admin-btn admin-btn--sm"
                        to={`/admin/utilisateurs/${u.id}`}
                        style={{ marginRight: "0.4rem" }}
                      >
                        Modifier
                      </Link>

                      {/* ✅ Supprimer */}
                      <button
                        className="admin-btn admin-btn--sm"
                        onClick={() => onDelete(u)}
                        disabled={deletingId === u.id}
                        title="Supprimer l'utilisateur"
                      >
                        {deletingId === u.id ? "…" : "Supprimer"}
                      </button>
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
                <button
                  className="admin-btn admin-btn--sm"
                  disabled={safePage <= 1}
                  onClick={() => setParam({ page: safePage - 1 })}
                >
                  ←
                </button>
                <button
                  className="admin-btn admin-btn--sm"
                  disabled={safePage >= totalPages}
                  onClick={() => setParam({ page: safePage + 1 })}
                >
                  →
                </button>
              </div>
            </div>

            <div style={{ padding: "0.85rem 1rem" }} className="admin-text-muted">
              Astuce : fais défiler horizontalement pour voir toutes les colonnes.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}