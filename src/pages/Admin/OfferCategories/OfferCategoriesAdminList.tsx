import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useToast from "@/hooks/useToast";
import {
  listOfferCategoriesAdmin,
  updateOfferCategoryAdmin,
  type OfferCategory,
  type OfferCategoryUpdatePayload,
} from "@/api/offerCategories.api";
import "@/styles/admin.css";

export default function OfferCategoriesAdminList() {
  const { showToast } = useToast();

  const [categories, setCategories] = useState<OfferCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // recherche simple (client-side)
  const [search, setSearch] = useState("");

  // évite multi-click pendant toggle
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await listOfferCategoriesAdmin();
        if (!mounted) return;
        setCategories(data);
      } catch (err) {
        console.error("CategoriesAdminList error:", err);
        if (!mounted) return;
        setError("Impossible de charger les catégories.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(
      (c) => c.code.toLowerCase().includes(q) || c.nom.toLowerCase().includes(q)
    );
  }, [categories, search]);

  function buildPayload(cat: OfferCategory, nextActive: boolean): OfferCategoryUpdatePayload {
    // On envoie un payload complet (compatible PATCH ou PUT)
    return {
      code: cat.code,
      nom: cat.nom,
      description: cat.description ?? null,
      cas_usage: cat.cas_usage ?? null,
      nb_personnes: cat.nb_personnes,
      ordre_affichage: cat.ordre_affichage,
      active: nextActive,
      auto_apply_all_events: cat.auto_apply_all_events,
    };
  }

  async function handleToggleActive(cat: OfferCategory) {
    const nextActive = !cat.active;

    const label = nextActive ? "activer" : "désactiver";
    const ok = window.confirm(`Confirmer : ${label} la catégorie ${cat.code} ?`);
    if (!ok) return;

    setTogglingId(cat.id);

    try {
      const payload = buildPayload(cat, nextActive);
      await updateOfferCategoryAdmin(cat.id, payload);

      // update state local
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, active: nextActive } : c))
      );

      showToast(nextActive ? "Catégorie activée" : "Catégorie désactivée", "success");
    } catch (err) {
      console.error("Toggle category error:", err);
      showToast("Action impossible.", "error");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="admin-page">
      <div style={{ marginBottom: "1.2rem" }}>
        <div className="admin-title">Catégories d’offres</div>
        <div className="admin-subtitle">
          Gestion des types d’offres (SOLO, DUO, FAMILLE, …)
          <span className="admin-text-muted" style={{ fontSize: "0.85rem" }}>
            {" "}
            ({categories.length})
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
              placeholder="Recherche (code ou nom)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <Link className="admin-btn" to="/admin/offres/categories/nouvelle">
              + Créer
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="admin-table-state">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="admin-table-state">Aucune catégorie trouvée.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Code</th>
                  <th>Nom</th>
                  <th className="admin-td-center">Nb personnes</th>
                  <th className="admin-td-center">Globale</th>
                  <th className="admin-td-center">Active</th>
                  <th className="admin-td-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((c) => {
                  const actionLabel = c.active ? "Désactiver" : "Activer";
                  const isBusy = togglingId === c.id;

                  return (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td>
                        <strong>{c.code}</strong>
                      </td>
                      <td>{c.nom}</td>
                      <td className="admin-td-center">{c.nb_personnes}</td>

                      <td className="admin-td-center">
                        <span
                          className={
                            c.auto_apply_all_events
                              ? "admin-badge admin-badge--ok"
                              : "admin-badge admin-badge--muted"
                          }
                        >
                          {c.auto_apply_all_events ? "OUI" : "NON"}
                        </span>
                      </td>

                      <td className="admin-td-center">
                        <span
                          className={
                            c.active
                              ? "admin-badge admin-badge--ok"
                              : "admin-badge admin-badge--danger"
                          }
                        >
                          {c.active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>

                      <td className="admin-td-right">
                        <Link
                          className="admin-btn admin-btn--sm"
                          to={`/admin/offres/categories/${c.id}`}
                          style={{ marginRight: "0.4rem" }}
                        >
                          Modifier
                        </Link>

                        <button
                          className="admin-btn admin-btn--sm"
                          type="button"
                          onClick={() => handleToggleActive(c)}
                          disabled={isBusy}
                        >
                          {isBusy ? "…" : actionLabel}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}