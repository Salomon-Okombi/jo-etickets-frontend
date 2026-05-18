//src/pages/Users/UserAdminList.tsx
import { useEffect, useMemo, useState } from "react";
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

/* ✅ TYPE = basé sur role backend */
function badgeType(role?: string) {
  const v = (role ?? "").toUpperCase();
  if (v === "ADMIN") return "admin-badge admin-badge--warn";
  if (v === "ORGANISATEUR") return "admin-badge admin-badge--ok";
  return "admin-badge admin-badge--muted";
}

/* ✅ STATUT = basé sur est_bloque / actif */
function badgeStatut(user: User) {
  if (user.est_bloque) return "admin-badge admin-badge--danger";
  if (user.is_active) return "admin-badge admin-badge--ok";
  return "admin-badge admin-badge--muted";
}

/* ✅ afficher tous les champs dynamiques */
function renderExtraFields(user: Record<string, any>) {
  const blacklist = new Set([
    "id",
    "username",
    "email",
    "role",
    "date_creation",
  ]);

  const entries = Object.entries(user).filter(
    ([k, v]) => !blacklist.has(k) && v !== null && v !== undefined
  );

  if (entries.length === 0) return "—";

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
      {entries.slice(0, 6).map(([k, v]) => (
        <span
          key={k}
          className="admin-badge admin-badge--muted"
          title={`${k} = ${String(v)}`}
        >
          {k}:{String(v)}
        </span>
      ))}
      {entries.length > 6 ? (
        <span className="admin-badge admin-badge--muted">
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
        setError("Chargement des utilisateurs impossible.");
        console.error(err);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    run();
    return () => controller.abort();
  }, [page, pageSize, q]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  function setParam(next: any) {
    const sp = new URLSearchParams(searchParams);

    if (next.q) sp.set("q", next.q);
    else sp.delete("q");

    sp.set("page", String(next.page ?? page));
    sp.set("page_size", String(next.page_size ?? pageSize));
    setSearchParams(sp);
  }

  async function onDelete(u: User) {
    if (!confirm(`Supprimer ${u.username} ?`)) return;

    setDeletingId(u.id);
    await deleteUser(u.id);
    setDeletingId(null);
    fetchUsers();
  }

  return (
    <div className="admin-page">
      <div className="admin-title">Utilisateurs</div>

      <div className="admin-table-wrap">
        {loading ? (
          <div>Chargement…</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Date création</th>
                <th>Extra</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {items.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>

                  <td>
                    <span className={badgeType(u.role)}>
                      {u.role}
                    </span>
                  </td>

                  <td>
                    <span className={badgeStatut(u)}>
                      {u.est_bloque
                        ? "BLOQUÉ"
                        : u.is_active
                        ? "ACTIF"
                        : "INACTIF"}
                    </span>
                  </td>

                  <td>{formatDate(u.date_creation)}</td>
                  <td>{renderExtraFields(u)}</td>

                  <td>
                    <Link to={`/admin/utilisateurs/${u.id}`}>
                      Modifier
                    </Link>

                    <button onClick={() => onDelete(u)}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}