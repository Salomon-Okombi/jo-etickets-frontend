import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import  api  from "@/api/axiosClient";
import useToast from "@/hooks/useToast";
import "@/styles/admin.css";

type OfferType = "SOLO" | "DUO" | "FAMILIALE" | string;

type Offer = {
  id: number;

  // Champs possibles (selon backend)
  nom?: string;
  titre?: string;

  type?: OfferType;
  categorie?: OfferType;

  description?: string;

  prix?: number | string;
  price?: number | string;

  capacite?: number;      // ex: 1,2,4 personnes
  nb_places?: number;     // fallback
  places?: number;        // fallback

  stock?: number;
  quota?: number;         // fallback

  actif?: boolean;
  is_active?: boolean;
  disponible?: boolean;
};

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

function pickName(o: Offer) {
  return o.nom ?? o.titre ?? `Offre #${o.id}`;
}

function pickType(o: Offer) {
  return (o.type ?? o.categorie ?? "—").toString();
}

function pickCapacity(o: Offer) {
  const c = o.capacite ?? o.nb_places ?? o.places;
  if (c === undefined || c === null) return "—";
  return c.toLocaleString("fr-FR");
}

function pickStock(o: Offer) {
  const s = o.stock ?? o.quota;
  if (s === undefined || s === null) return "—";
  return s.toLocaleString("fr-FR");
}

function pickPrice(o: Offer) {
  const v = o.prix ?? o.price;
  if (v === undefined || v === null) return "—";
  const num = typeof v === "string" ? Number(v) : v;
  if (Number.isFinite(num)) return num.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  return String(v);
}

function pickActive(o: Offer): boolean | undefined {
  // support de différents backends
  if (typeof o.actif === "boolean") return o.actif;
  if (typeof o.is_active === "boolean") return o.is_active;
  if (typeof o.disponible === "boolean") return o.disponible;
  return undefined;
}

function activeBadgeClass(active?: boolean) {
  if (active === true) return "admin-badge admin-badge--ok";
  if (active === false) return "admin-badge admin-badge--danger";
  return "admin-badge admin-badge--muted";
}

function activeLabel(active?: boolean) {
  if (active === true) return "ACTIVE";
  if (active === false) return "INACTIVE";
  return "—";
}

function typeBadgeClass(type: string) {
  const t = type.toUpperCase();
  if (t.includes("SOLO")) return "admin-badge admin-badge--ok";
  if (t.includes("DUO")) return "admin-badge admin-badge--warn";
  if (t.includes("FAM")) return "admin-badge admin-badge--danger";
  return "admin-badge admin-badge--muted";
}

export default function OffersAdminList() {
  const { showToast } = useToast();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [count, setCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Recherche (debounce)
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Filtre type (optionnel)
  const [typeFilter, setTypeFilter] = useState<string>("");

  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchOffers() {
      try {
        setLoading(true);
        setError(null);

        const params: Record<string, string | number> = {
          page,
          page_size: pageSize,
        };
        if (search) params.search = search;
        if (typeFilter) {
          // backend possible: type/categorie
          params.type = typeFilter;
        }

        // ✅ Endpoint attendu (à adapter si besoin)
        const { data } = await api.get<Paginated<Offer>>("/offres/", {
          params,
          signal: controller.signal,
        });

        setOffers(data.results);
        setCount(data.count);
      } catch (err: any) {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
        console.error("Admin Offers: fetch error =", err);
        setError("Chargement des offres impossible.");
      } finally {
        setLoading(false);
      }
    }

    fetchOffers();
    return () => controller.abort();
  }, [page, pageSize, search, typeFilter]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  async function handleDelete(id: number) {
    const ok = window.confirm("Supprimer cette offre ? Cette action est irréversible.");
    if (!ok) return;

    try {
      // ✅ Endpoint attendu (à adapter si besoin)
      await api.delete(`/offres/${id}/`);
      showToast("Offre supprimée ✅", "success");

      // refresh local + ajustement pages
      const nextCount = Math.max(0, count - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextCount / pageSize));
      if (page > nextTotalPages) setPage(nextTotalPages);
      else {
        setOffers((prev) => prev.filter((o) => o.id !== id));
        setCount(nextCount);
      }
    } catch (err) {
      console.error("Admin Offers: delete error =", err);
      showToast("Suppression impossible (vérifie les droits / endpoint).", "error");
    }
  }

  return (
    <div className="admin-page">
      {/* Header page */}
      <div style={{ marginBottom: "1.2rem" }}>
        <div className="admin-title">Offres</div>
        <div className="admin-subtitle">
          Gestion des packs (SOLO / DUO / FAMILIALE) : tarifs, quotas, activation.{" "}
          <span className="admin-text-muted" style={{ fontSize: "0.85rem" }}>
            {count.toLocaleString("fr-FR")} offre(s)
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
            <div className="admin-table-title">Liste des offres</div>
            <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginTop: "0.15rem" }}>
              Recherche + filtre + pagination
            </div>
          </div>

          <div className="admin-table-tools">
            <input
              className="admin-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Recherche (nom, type, description...)"
            />

            <select
              className="admin-select"
              value={typeFilter}
              onChange={(e) => {
                setPage(1);
                setTypeFilter(e.target.value);
              }}
            >
              <option value="">Tous types</option>
              <option value="SOLO">SOLO</option>
              <option value="DUO">DUO</option>
              <option value="FAMILIALE">FAMILIALE</option>
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

            <Link className="admin-btn" to="/admin/offres/nouvelle">
              + Créer
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="admin-table-state">Chargement…</div>
        ) : offers.length === 0 ? (
          <div className="admin-table-state">Aucune offre trouvée.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom</th>
                  <th className="admin-td-center">Type</th>
                  <th className="admin-td-right">Prix</th>
                  <th className="admin-td-center">Places</th>
                  <th className="admin-td-center">Stock</th>
                  <th className="admin-td-center">Statut</th>
                  <th className="admin-td-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {offers.map((o) => {
                  const type = pickType(o);
                  const active = pickActive(o);

                  return (
                    <tr key={o.id}>
                      <td>{o.id}</td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{pickName(o)}</div>
                        {o.description ? (
                          <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginTop: "0.15rem" }}>
                            {o.description}
                          </div>
                        ) : null}
                      </td>

                      <td className="admin-td-center">
                        <span className={typeBadgeClass(type)}>{type}</span>
                      </td>

                      <td className="admin-td-right">{pickPrice(o)}</td>
                      <td className="admin-td-center">{pickCapacity(o)}</td>
                      <td className="admin-td-center">{pickStock(o)}</td>

                      <td className="admin-td-center">
                        <span className={activeBadgeClass(active)}>{activeLabel(active)}</span>
                      </td>

                      <td className="admin-td-right">
                        <Link
                          className="admin-btn admin-btn--sm"
                          to={`/admin/offres/${o.id}`}
                          style={{ marginRight: "0.4rem" }}
                        >
                          Modifier
                        </Link>

                        <button className="admin-btn admin-btn--sm" onClick={() => handleDelete(o.id)}>
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
                {count.toLocaleString("fr-FR")} offre(s) — page {page} / {totalPages}
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