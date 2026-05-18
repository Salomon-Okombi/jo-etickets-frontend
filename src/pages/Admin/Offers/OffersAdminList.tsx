import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/api/axiosClient";
import useToast from "@/hooks/useToast";
import { listOfferCategoriesAdmin, type OfferCategory } from "@/api/offerCategories.api";
import "@/styles/admin.css";

type OfferStatus = "ACTIVE" | "INACTIVE" | "EPUISEE" | "EXPIREE";

type OfferRow = {
  id: number;

  evenement: number;
  evenement_nom?: string | null;

  categorie: number;
  categorie_code?: string | null;
  categorie_nom?: string | null;

  nom_offre: string;
  description?: string | null;

  prix_calcule?: string; // "12.00"
  nb_personnes?: number; // 1/2/4

  quota_billets_total: number;
  quota_billets_restant: number;

  packs_total?: number;
  packs_disponibles?: number;

  date_debut_vente: string;
  date_fin_vente: string;

  statut: OfferStatus;
  est_disponible?: boolean;
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

function fmtMoney(v?: string | number | null) {
  if (v === undefined || v === null) return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function fmtDateTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR");
}

function badgeClassForStatut(statut: OfferStatus) {
  if (statut === "ACTIVE") return "admin-badge admin-badge--ok";
  if (statut === "INACTIVE") return "admin-badge admin-badge--muted";
  if (statut === "EPUISEE") return "admin-badge admin-badge--warn";
  return "admin-badge admin-badge--danger"; // EXPIREE
}

export default function OffersAdminList() {
  const { showToast } = useToast();

  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [count, setCount] = useState(0);

  const [categories, setCategories] = useState<OfferCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [categorieId, setCategorieId] = useState<number | "">("");
  const [statut, setStatut] = useState<OfferStatus | "">("");

  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCats() {
      setLoadingCats(true);
      try {
        const cats = await listOfferCategoriesAdmin(); // renvoie OfferCategory[]
        if (controller.signal.aborted) return;
        setCategories(cats);
      } catch (err: any) {
        if (isCanceledError(err) || controller.signal.aborted) return;
        setCategories([]);
      } finally {
        if (!controller.signal.aborted) setLoadingCats(false);
      }
    }

    loadCats();
    return () => controller.abort();
  }, []);

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
        if (categorieId !== "") params.categorie = Number(categorieId);
        if (statut !== "") params.statut = statut;

        const { data } = await api.get<Paginated<OfferRow>>("/offres/", {
          params,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        setOffers(data.results);
        setCount(data.count);
      } catch (err: any) {
        if (isCanceledError(err) || controller.signal.aborted) return;
        console.error("Admin Offers: fetch error =", err);
        setError("Chargement des offres impossible.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchOffers();
    return () => controller.abort();
  }, [page, pageSize, search, categorieId, statut]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  async function handleDelete(id: number) {
    const ok = window.confirm("Supprimer cette offre ? Cette action est irréversible.");
    if (!ok) return;

    try {
      await api.delete(`/offres/${id}/`);
      showToast("Offre supprimée", "success");

      const nextCount = Math.max(0, count - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextCount / pageSize));
      if (page > nextTotalPages) setPage(nextTotalPages);
      else {
        setOffers((prev) => prev.filter((o) => o.id !== id));
        setCount(nextCount);
      }
    } catch (err) {
      console.error("Admin Offers: delete error =", err);
      showToast("Suppression impossible (vérifie les droits).", "error");
    }
  }

  return (
    <div className="admin-page">
      <div style={{ marginBottom: "1.2rem" }}>
        <div className="admin-title">Offres</div>
        <div className="admin-subtitle">
          Gestion des packs (catégories, quotas billets, fenêtre de vente, statut).{" "}
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

      <div className="admin-table-wrap" style={{ marginTop: "1rem" }}>
        <div className="admin-table-head">
          <div>
            <div className="admin-table-title">Liste des offres</div>
            <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginTop: "0.15rem" }}>
              Recherche + filtres + pagination
            </div>
          </div>

          <div className="admin-table-tools">
            <input
              className="admin-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Recherche (nom, catégorie, événement...)"
            />

            <select
              className="admin-select"
              value={categorieId}
              onChange={(e) => {
                setPage(1);
                setCategorieId(e.target.value ? Number(e.target.value) : "");
              }}
              disabled={loadingCats}
            >
              <option value="">Toutes catégories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.nom}
                </option>
              ))}
            </select>

            <select
              className="admin-select"
              value={statut}
              onChange={(e) => {
                setPage(1);
                setStatut((e.target.value as OfferStatus) || "");
              }}
            >
              <option value="">Tous statuts</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="EPUISEE">EPUISEE</option>
              <option value="EXPIREE">EXPIREE</option>
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
                  <th>Événement</th>
                  <th>Catégorie</th>
                  <th className="admin-td-right">Prix</th>
                  <th className="admin-td-center">Billets</th>
                  <th className="admin-td-center">Quota billets</th>
                  <th className="admin-td-center">Packs dispo</th>
                  <th className="admin-td-center">Statut</th>
                  <th>Vente</th>
                  <th className="admin-td-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {offers.map((o) => {
                  const catLabel =
                    o.categorie_code
                      ? `${o.categorie_code}${o.categorie_nom ? ` — ${o.categorie_nom}` : ""}`
                      : `#${o.categorie}`;

                  const packsDispo =
                    o.packs_disponibles !== undefined
                      ? o.packs_disponibles
                      : Math.floor(o.quota_billets_restant / Math.max(1, o.nb_personnes ?? 1));

                  return (
                    <tr key={o.id}>
                      <td>{o.id}</td>

                      <td>
                        <div style={{ fontWeight: 700 }}>{o.nom_offre}</div>
                        {o.description ? (
                          <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginTop: "0.15rem" }}>
                            {o.description}
                          </div>
                        ) : null}
                      </td>

                      <td>{o.evenement_nom ?? `#${o.evenement}`}</td>
                      <td>{catLabel}</td>

                      <td className="admin-td-right">{fmtMoney(o.prix_calcule)}</td>

                      <td className="admin-td-center">{o.nb_personnes ?? "—"}</td>

                      <td className="admin-td-center">
                        {o.quota_billets_restant.toLocaleString("fr-FR")} / {o.quota_billets_total.toLocaleString("fr-FR")}
                      </td>

                      <td className="admin-td-center">{packsDispo.toLocaleString("fr-FR")}</td>

                      <td className="admin-td-center">
                        <span className={badgeClassForStatut(o.statut)}>{o.statut}</span>
                      </td>

                      <td>
                        <div className="admin-text-muted" style={{ fontSize: "0.85rem" }}>
                          {fmtDateTime(o.date_debut_vente)} → {fmtDateTime(o.date_fin_vente)}
                        </div>
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