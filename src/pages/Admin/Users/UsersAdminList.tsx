// src/pages/Users/UserAdminList.tsx
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listUsers, deleteUser } from "@/api/users.api";
import type { User } from "@/types/users";
import "@/styles/admin.css";

function formatDate(value?: string) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("fr-FR");
  } catch {
    return value;
  }
}

/* TYPE basé sur backend */
function badgeType(role?: string) {
  const v = (role ?? "").toUpperCase();

  if (v === "ADMIN") return "admin-badge admin-badge--warn";
  if (v === "ORGANISATEUR") return "admin-badge admin-badge--ok";

  return "admin-badge admin-badge--muted";
}

/* STATUT basé sur backend */
function badgeStatut(user: User) {
  if (user.est_bloque) return "admin-badge admin-badge--danger";
  if (user.is_active) return "admin-badge admin-badge--ok";

  return "admin-badge admin-badge--muted";
}

/* champs extra ✅ */
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
        >
          {k}:{String(v)}
        </span>
      ))}
    </div>
  );
}

export default function UsersAdminList() {
  const [searchParams] = useSearchParams();

  const page = Number(searchParams.get("page") ?? 1) || 1;
  const pageSize = Number(searchParams.get("page_size") ?? 20) || 20;
  const q = searchParams.get("q") ?? "";

  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchUsers() {
      try {
        setLoading(true);

        const data = await listUsers({
          page,
          page_size: pageSize,
          search: q || undefined,
        });

        setItems(data.results);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();

    return () => controller.abort();
  }, [page, pageSize, q]);

  async function onDelete(u: User) {
    if (!confirm(`Supprimer ${u.username} ?`)) return;

    try {
      await deleteUser(u.id);

      // refresh
      const data = await listUsers({
        page,
        page_size: pageSize,
        search: q || undefined,
      });

      setItems(data.results);
    } catch (err) {
      console.error(err);
    }
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