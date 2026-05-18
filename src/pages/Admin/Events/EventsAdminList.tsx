// src/pages/Admin/Events/EventsAdminList.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/api/axiosClient";
import useToast from "@/hooks/useToast";
import "@/styles/admin.css";

type EventStatus = "BROUILLON" | "PUBLIE" | "ARCHIVE";

type AdminEvent = {
  id: number;
  nom_evenement: string;
  discipline?: string;
  lieu: string;
  date_debut: string;
  date_fin: string;
  prix_base: string;
  statut: EventStatus;
};

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

function isCanceledError(err: any) {
  return err?.code === "ERR_CANCELED" || err?.name === "CanceledError" || err?.name === "AbortError";
}

/* ===============================
   HELPERS
=============================== */

function formatDate(value?: string) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("fr-FR");
  } catch {
    return value;
  }
}

function statutBadgeClass(statut: EventStatus) {
  switch (statut) {
    case "PUBLIE":
      return "admin-badge admin-badge--ok";
    case "ARCHIVE":
      return "admin-badge admin-badge--danger";
    default:
      return "admin-badge admin-badge--muted";
  }
}

/* ===============================
   COMPONENT
=============================== */

export default function EventsAdminList() {
  const { showToast } = useToast();

  const [events, setEvents] = useState<AdminEvent[]>([]);
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

        const { data } = await api.get<Paginated<AdminEvent>>("/evenements/admin/", {
          params,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        setEvents(data.results);
        setCount(data.count);
      } catch (err: any) {
        if (isCanceledError(err) || controller.signal.aborted) return;
        console.error("Admin Events: fetch error =", err);
        setError("Chargement des événements impossible.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
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
      await api.delete(`/evenements/admin/${id}/`);
      showToast("Événement supprimé", "success");

      const nextCount = Math.max(0, count - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextCount / pageSize));

      // si la page devient vide, on recule d’une page si possible
      if (page > nextTotalPages) {
        setPage(nextTotalPages);
      } else {
        setEvents((prev) => prev.filter((e) => e.id !== id));
        setCount(nextCount);
      }
    } catch (err) {
      console.error("Admin Events: delete error =", err);
      showToast("Suppression impossible.", "error");
    }
  }

  return (
    <div className="admin-page">
      <div style={{ marginBottom: "1.2rem" }}>
        <div className="admin-title">Événements</div>
        <div className="admin-subtitle">
          Gestion des épreuves{" "}
          <span className="admin-text-muted" style={{ fontSize: "0.85rem" }}>
            ({count.toLocaleString("fr-FR")})
          </span>
        </div>
      </div>

      {error && (
        <div className="admin-alert" role="alert">
          {error}
        </div>
      )}

      <div className="admin-table-wrap" style={{ marginTop: "1rem" }}>
        <div className="admin-table-head">
          <div className="admin-table-tools">
            <input
              className="admin-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Recherche (nom, discipline, lieu...)"
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
                  <th>Nom</th>
                  <th>Discipline</th>
                  <th>Début</th>
                  <th>Fin</th>
                  <th>Lieu</th>
                  <th>Statut</th>
                  <th className="admin-td-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td>{e.id}</td>
                    <td>{e.nom_evenement}</td>
                    <td>{e.discipline ?? "—"}</td>
                    <td>{formatDate(e.date_debut)}</td>
                    <td>{formatDate(e.date_fin)}</td>
                    <td>{e.lieu}</td>
                    <td className="admin-td-center">
                      <span className={statutBadgeClass(e.statut)}>{e.statut}</span>
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
                ))}
              </tbody>
            </table>

            <div className="admin-table-footer">
              <div className="admin-table-footer__text">
                Page {page} / {totalPages}
              </div>

              <div className="admin-table-footer__actions">
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