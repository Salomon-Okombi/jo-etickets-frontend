import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listOfferCategories, type OfferCategory } from "@/api/offerCategories.api";

function kindLabel(code: string) {
  const c = (code || "").toUpperCase();
  if (c === "FAMILIALE") return "Famille";
  return c;
}

export default function OffersListPage() {
  const navigate = useNavigate();

  const [cats, setCats] = useState<OfferCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const rows = await listOfferCategories(); // maintenant: array garanti
        if (!mounted) return;

        setCats(rows);
      } catch {
        if (!mounted) return;
        setError("Impossible de charger les catégories d’offres.");
        setCats([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const sorted = useMemo(() => {
    return [...cats].sort(
      (a, b) => (a.ordre_affichage ?? 0) - (b.ordre_affichage ?? 0)
    );
  }, [cats]);

  return (
    <div className="offers-page">
      <section className="offers-page__hero">
        <div className="offers-page__hero-inner">
          <h1 className="offers-page__title">Offres</h1>
          <p className="offers-page__subtitle">
            Cette page présente les catégories d’offres disponibles. Les catégories sont gérées par l’administration et peuvent évoluer.
          </p>
        </div>
      </section>

      <section className="offers-page__content">
        <div className="offers-page__inner">
          {loading ? <div className="offers-page__state">Chargement…</div> : null}

          {error && !loading ? (
            <div className="offers-page__state offers-page__state--error">{error}</div>
          ) : null}

          {!loading && !error && sorted.length === 0 ? (
            <div className="offers-page__state">Aucune catégorie d’offre.</div>
          ) : null}

          {!loading && !error && sorted.length > 0 ? (
            <div className="offers-page__grid">
              {sorted.map((c) => (
                <article key={c.id} className="offer-card">
                  <header className="offer-card__header">
                    <span
                      className={`offer-card__badge offer-card__badge--${kindLabel(c.code).toLowerCase()}`}
                    >
                      {kindLabel(c.code)}
                    </span>
                    <h2 className="offer-card__title">{c.nom}</h2>
                  </header>

                  <p className="offer-card__description">
                    {c.description || "Catégorie d’offre disponible pour la billetterie."}
                  </p>

                  <dl className="offer-card__details">
                    <div className="offer-card__detail-row">
                      <dt>Nombre de billets</dt>
                      <dd>{c.nb_personnes}</dd>
                    </div>
                    <div className="offer-card__detail-row">
                      <dt>Cas d’usage</dt>
                      <dd>{c.cas_usage ? c.cas_usage : "—"}</dd>
                    </div>
                  </dl>

                  <div className="offer-card__actions">
                    <button
                      type="button"
                      className="offer-card__cta"
                      onClick={() => navigate(`/evenements?cat=${encodeURIComponent(c.code)}`)}
                    >
                      Voir les événements
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
