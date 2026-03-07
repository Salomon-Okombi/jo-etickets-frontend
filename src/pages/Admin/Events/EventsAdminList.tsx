import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/axiosClient";
import useToast from "@/hooks/useToast";
import "@/styles/admin.css";

type Event = {
  id: number;
  titre?: string;
  nom?: string; // fallback si le backend utilise "nom"
  discipline?: string;
  date?: string; // ISO
  date_evenement?: string; // fallback
  lieu?: string;
  location?: string; // fallback
  capacite?: number;
  capacity?: number; // fallback
  actif?: boolean;
  is_active?: boolean; // fallback
};

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

function pickTitle(e: Event) {
  return e.titre ?? e.nom ?? `Événement #${e.id}`;
}

function pickDate(e: Event) {
  return e.date ?? e.date_evenement ?? "";
}

function formatDate(value?: string) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("fr-FR");
  } catch {
    return value;
  }
}

function pickLieu(e: Event) {
  return e.lieu ?? e.location ?? "—";
}

function pickCapacite(e: Event) {
  const c = e.capacite ?? e.capacity;
  if (c === undefined || c === null) return "—";
  return c.toLocaleString("fr-FR");
}

function activeBadgeClass(active?: boolean) {
  if (active === true) return "admin-badge admin-badge--ok";
  if (active === false) return "admin-badge admin-badge--danger";
  return "admin-badge admin-badge--muted";
}

function activeLabel(active?: boolean) {
  if (active === true) return "ACTIF";
  if (active === false) return "INACTIF";
  return "—";
}

export default function EventsAdminList() {
  const { showToast } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [count, setCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Recherche (debounce)
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchEvents() {
      try {
        setLoading(true);
        setError(null);

        const params: Record<string, string | number> = {
          page,
          page_size: pageSize,
        };
        if (search) params.search = search;

        // ✅ Endpoint attendu (à adapter si besoin)
        const { data } = await api.get<Paginated<Event>>("/evenements/", {
          params,
          signal: controller.signal,
        });

        setEvents(data.results);
        setCount(data.count);
      } catch (err: any) {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
        console.error("Admin Events: fetch error =", err);
        setError("Chargement des événements impossible.");
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
    return () => controller.abort();
  }, [page, pageSize, search]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  async function handleDelete(id: number) {
    const ok = window.confirm("Supprimer cet événement ? Cette action est irréversible.");
    if (!ok) return;

    try {
      // ✅ Endpoint attendu (à adapter si besoin)
      await api.delete(`/evenements/${id}/`);
      showToast("Événement supprimé ✅", "success");

      // Refresh : si la page devient vide après suppression, on recule d'une page si possible
      const nextCount = Math.max(0, count - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextCount / pageSize));
      if (page > nextTotalPages) setPage(nextTotalPages);
      else {
        // refetch "soft"
        setEvents((prev) => prev.filter((e) => e.id !== id));
        setCount(nextCount);
      }
    } catch (err) {
      console.error("Admin Events: delete error =", err);
      showToast("Suppression impossible (vérifie les droits / endpoint).", "error");
    }
  }

  return (
    <div className="admin-page">
      {/* Header page */}
      <div style={{ marginBottom: "1.2rem" }}>
        <div className="admin-title">Événements</div>
        <div className="admin-subtitle">
          Gestion des épreuves (création, modification, activation).{" "}
          <span className="admin-text-muted" style={{ fontSize: "0.85rem" }}>
            {count.toLocaleString("fr-FR")} événement(s)
          </span>
        </div>
      </div>

      {error ? (
        <div className="admin-alert" role="alert">
          {error}
        </div>
      ) : null}

      {/* Table */}
      <div className="admin-table-wrap" style={{ marginTop: "1rem" }}>
        <div className="admin-table-head">
          <div>
            <div className="admin-table-title">Liste des événements</div>
            <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginTop: "0.15rem" }}>
              Recherche + pagination
            </div>
          </div>

          <div className="admin-table-tools">
            <input
              className="admin-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Recherche (titre, discipline, lieu...)"
            />

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

            <Link className="admin-btn" to="/admin/evenements/nouveau">
              + Créer
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="admin-table-state">Chargement…</div>
        ) : events.length === 0 ? (
          <div className="admin-table-state">Aucun événement trouvé.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Titre</th>
                  <th>Discipline</th>
                  <th>Date</th>
                  <th>Lieu</th>
                  <th className="admin-td-center">Capacité</th>
                  <th className="admin-td-center">Statut</th>
                  <th className="admin-td-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {events.map((e) => {
                  const active = e.actif ?? e.is_active;
                  return (
                    <tr key={e.id}>
                      <td>{e.id}</td>
                      <td>{pickTitle(e)}</td>
                      <td>{e.discipline ?? "—"}</td>
                      <td>{formatDate(pickDate(e))}</td>
                      <td>{pickLieu(e)}</td>
                      <td className="admin-td-center">{pickCapacite(e)}</td>
                      <td className="admin-td-center">
                        <span className={activeBadgeClass(active)}>{activeLabel(active)}</span>
                      </td>
                      <td className="admin-td-right">
                        <Link
                          className="admin-btn admin-btn--sm"
                          to={`/admin/evenements/${e.id}`}
                          style={{ marginRight: "0.4rem" }}
                        >
                          Modifier
                        </Link>

                        <button className="admin-btn admin-btn--sm" onClick={() => handleDelete(e.id)}>
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="admin-table-footer">
              <div className="admin-table-footer__text">
                {count.toLocaleString("fr-FR")} événement(s) — page {page} / {totalPages}
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className="admin-btn admin-btn--sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
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