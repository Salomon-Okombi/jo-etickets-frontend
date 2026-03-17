import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listOffers } from "@/api/offers.api";
import type { Offer } from "@/types/offers";
import { useCart } from "@/features/cart/useCart";

type FilterType = "ALL" | "SOLO" | "DUO" | "FAMILLE";

const OffersListPage: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAddId, setLoadingAddId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>("ALL");

  const navigate = useNavigate();
  const { addItem } = useCart();

  useEffect(() => {
    let mounted = true;

    async function fetchOffers() {
      try {
        setLoading(true);
        setError(null);
        const data = await listOffers();
        if (!mounted) return;
        setOffers((data as any).results ?? data);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError("Impossible de charger les offres pour le moment.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchOffers();
    return () => {
      mounted = false;
    };
  }, []);

  const getOfferKind = (offer: Offer): FilterType => {
    if (offer.nb_personnes === 1) return "SOLO";
    if (offer.nb_personnes === 2) return "DUO";
    if (offer.nb_personnes === 4) return "FAMILLE";

    const type = offer.type_offre?.toUpperCase() ?? "";
    if (type.includes("SOLO")) return "SOLO";
    if (type.includes("DUO")) return "DUO";
    if (type.includes("FAMIL")) return "FAMILLE";
    return "ALL";
  };

  const filteredOffers = useMemo(
    () => offers.filter((offer) => (filterType === "ALL" ? true : getOfferKind(offer) === filterType)),
    [offers, filterType]
  );

  const formatPrice = (raw: Offer["prix"]) => {
    const value = typeof raw === "string" ? parseFloat(raw || "0") : Number(raw ?? 0);
    return value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  };

  const formatPeopleLabel = (offer: Offer) => {
    const kind = getOfferKind(offer);
    if (kind === "SOLO") return "1 personne";
    if (kind === "DUO") return "2 personnes";
    if (kind === "FAMILLE") return "4 personnes";
    return offer.nb_personnes ? `${offer.nb_personnes} personnes` : "Nombre variable";
  };

  const getAvailability = (offer: Offer): { ok: boolean; label: string } => {
    const statut = (offer.statut ?? "").toUpperCase();
    const stock = Number(offer.stock_disponible ?? 0);

    if (statut !== "ACTIVE") {
      if (statut === "EPUISEE") return { ok: false, label: "Épuisée" };
      if (statut === "EXPIREE") return { ok: false, label: "Expirée" };
      return { ok: false, label: "Indisponible" };
    }

    if (stock <= 0) return { ok: false, label: "Stock épuisé" };

    const now = new Date();
    const start = offer.date_debut_vente ? new Date(offer.date_debut_vente) : null;
    const end = offer.date_fin_vente ? new Date(offer.date_fin_vente) : null;

    if (start && !Number.isNaN(start.getTime()) && now < start) return { ok: false, label: "Bientôt" };
    if (end && !Number.isNaN(end.getTime()) && now > end) return { ok: false, label: "Expirée" };

    return { ok: true, label: "Disponible" };
  };

  const handleAddToCart = async (offer: Offer) => {
    const av = getAvailability(offer);
    if (!av.ok) return;

    try {
      setLoadingAddId(offer.id);
      setError(null);

      addItem({
        offre: offer.id,
        quantite: 1,
        nom_offre: offer.nom_offre,
        prix: offer.prix,
        nb_personnes: offer.nb_personnes ?? undefined,
      });

      navigate("/panier");
    } catch (err) {
      console.error(err);
      setError("Impossible d’ajouter l’offre au panier.");
    } finally {
      setLoadingAddId(null);
    }
  };

  return (
    <div className="offers-page">
      <section className="offers-page__hero">
        <div className="offers-page__hero-inner">
          <h1 className="offers-page__title">Offres disponibles</h1>
          <p className="offers-page__subtitle">
            Choisissez une offre Solo, Duo ou Famille. Ajoutez au panier en visiteur puis connectez-vous au moment de payer.
          </p>
        </div>
      </section>

      <section className="offers-page__content">
        <div className="offers-page__inner">
          <div className="offers-page__filters">
            <span className="offers-page__filters-label">Type d&apos;offre :</span>
            <div className="offers-page__filters-buttons">
              {(["ALL", "SOLO", "DUO", "FAMILLE"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`offers-page__filter-btn ${filterType === t ? "offers-page__filter-btn--active" : ""}`}
                  onClick={() => setFilterType(t)}
                >
                  {t === "ALL" ? "Toutes" : t === "FAMILLE" ? "Famille" : t === "SOLO" ? "Solo" : "Duo"}
                </button>
              ))}
            </div>
          </div>

          {loading && <div className="offers-page__state"><p>Chargement…</p></div>}
          {error && !loading && <div className="offers-page__state offers-page__state--error"><p>{error}</p></div>}

          {!loading && !error && filteredOffers.length === 0 && (
            <div className="offers-page__state"><p>Aucune offre disponible.</p></div>
          )}

          {!loading && !error && filteredOffers.length > 0 && (
            <div className="offers-page__grid">
              {filteredOffers.map((offer) => {
                const kind = getOfferKind(offer);
                const av = getAvailability(offer);
                const isAdding = loadingAddId === offer.id;

                return (
                  <article key={offer.id} className="offer-card">
                    <header className="offer-card__header">
                      <span className={`offer-card__badge offer-card__badge--${kind.toLowerCase()}`}>
                        {kind === "ALL" ? offer.type_offre : kind === "FAMILLE" ? "Famille" : kind === "SOLO" ? "Solo" : "Duo"}
                      </span>
                      <h2 className="offer-card__title">{offer.nom_offre}</h2>
                    </header>

                    <p className="offer-card__description">
                      {offer.description || "Offre pour assister à une épreuve des JO."}
                    </p>

                    <dl className="offer-card__details">
                      <div className="offer-card__detail-row">
                        <dt>Nombre de personnes</dt>
                        <dd>{formatPeopleLabel(offer)}</dd>
                      </div>
                      <div className="offer-card__detail-row">
                        <dt>Prix</dt>
                        <dd>{formatPrice(offer.prix)}</dd>
                      </div>
                      <div className="offer-card__detail-row">
                        <dt>Stock</dt>
                        <dd>{offer.stock_disponible > 0 ? `${offer.stock_disponible} places` : "Complet"}</dd>
                      </div>
                      <div className="offer-card__detail-row">
                        <dt>Statut</dt>
                        <dd>{av.label}</dd>
                      </div>
                    </dl>

                    <div className="offer-card__actions">
                      <button
                        type="button"
                        className="offer-card__cta"
                        disabled={!av.ok || isAdding}
                        onClick={() => handleAddToCart(offer)}
                      >
                        {isAdding ? "Ajout…" : av.ok ? "Ajouter au panier" : "Indisponible"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default OffersListPage;