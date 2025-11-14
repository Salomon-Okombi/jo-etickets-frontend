// src/pages/Admin/Users/UsersAdminList.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import useAdminUsers, { type AdminUser } from "@/features/admin/hooks/useAdminUsers";
import { formatDateTime } from "@/utils/format";

const PAGE_SIZE = 20;

export default function UsersAdminList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const page = Number(searchParams.get("page") ?? 1) || 1;

  // ⬅️ on récupère `list`, pas `items`
  const { list, loading, error, reload } = useAdminUsers();

  // tableau brut issu de l’API
  const items: AdminUser[] = list?.results ?? [];

  // Recharge la liste une fois au montage
  useEffect(() => {
    void reload();
  }, [reload]);

  // Filtrage côté front
  const filtered: AdminUser[] = useMemo(() => {
    if (!q) return items;
    const needle = q.toLowerCase();
    return items.filter((u) => {
      const username = u.username?.toLowerCase() ?? "";
      const email = u.email?.toLowerCase() ?? "";
      return username.includes(needle) || email.includes(needle);
    });
  }, [items, q]);

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const pageItems: AdminUser[] = useMemo(() => {
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page, totalPages]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const sp = new URLSearchParams(searchParams);
    if (q) sp.set("q", q);
    else sp.delete("q");
    sp.set("page", "1");
    setSearchParams(sp);
  }

  function goTo(p: number) {
    const safe = Math.min(Math.max(1, p), totalPages);
    const sp = new URLSearchParams(searchParams);
    sp.set("page", String(safe));
    if (q) sp.set("q", q);
    else sp.delete("q");
    setSearchParams(sp);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold">Utilisateurs — Administration</h1>
        <button className="btn btn-outline" onClick={() => reload()} disabled={loading}>
          {loading ? <span className="loading loading-spinner loading-xs" /> : "Actualiser"}
        </button>
      </div>

      <form onSubmit={onSearch} className="flex gap-2">
        <input
          className="input input-bordered w-full max-w-lg"
          placeholder="Rechercher par username ou email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn" type="submit" disabled={loading}>
          Rechercher
        </button>
      </form>

      {error && (
        <div className="alert alert-error">
          <span>{String(error)}</span>
        </div>
      )}

      <div className="card bg-base-100 shadow">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Staff</th>
                  <th>Dernière connexion</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8}>
                      <div className="flex justify-center py-10">
                        <span className="loading loading-spinner loading-lg" />
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && pageItems.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <div className="alert">
                        <span>Aucun utilisateur trouvé.</span>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  pageItems.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td className="font-medium">{u.username}</td>
                      <td>{u.email || "-"}</td>
                      <td>{u.type_compte ?? (u.is_staff ? "ADMIN" : "CLIENT")}</td>
                      <td>{u.statut ?? (u.is_active ? "ACTIF" : "INACTIF")}</td>
                      <td>{u.is_staff ? "Oui" : "Non"}</td>
                      <td>{u.derniere_connexion ? formatDateTime(u.derniere_connexion) : "-"}</td>
                      <td className="text-right">
                        <Link to={`/admin/users/${u.id}`} className="btn btn-sm">
                          Détails
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 flex items-center justify-between">
            <span className="text-sm opacity-70">
              {totalCount} utilisateur{totalCount > 1 ? "s" : ""} — page {page}/{totalPages}
            </span>
            <div className="join">
              <button
                className="btn join-item"
                onClick={() => goTo(1)}
                disabled={page <= 1}
              >
                «
              </button>
              <button
                className="btn join-item"
                onClick={() => goTo(page - 1)}
                disabled={page <= 1}
              >
                Préc.
              </button>
              <button
                className="btn join-item"
                onClick={() => goTo(page + 1)}
                disabled={page >= totalPages}
              >
                Suiv.
              </button>
              <button
                className="btn join-item"
                onClick={() => goTo(totalPages)}
                disabled={page >= totalPages}
              >
                »
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
