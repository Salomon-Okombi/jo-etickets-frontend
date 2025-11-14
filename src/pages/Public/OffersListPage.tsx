import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listOffers, type Offer } from "@/api/offers.api";
import { api } from "@/api/axiosClient";
import { useAuth } from "@/hooks/useAuth";

type FilterType = "ALL" | "SOLO" | "DUO" | "FAMILLE";

const OffersListPage: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAddId, setLoadingAddId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>("ALL");

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Charger les offres depuis l'API
  useEffect(() => {
    let mounted = true;

    async function fetchOffers() {
      try {
        setLoading(true);
        setError(null);
        const data = await listOffers();
        if (!mounted) return;
        setOffers(data.results ?? data); // au cas où l’API ne serait pas paginée
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError("Impossible de charger les offres pour le moment.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchOffers();

    return () => {
      mounted = false;
    };
  }, []);

  // Déterminer le type d’offre (Solo/Duo/Famille) à partir de nb_personnes / type_offre
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
    () =>
      offers.filter((offer) =>
        filterType === "ALL" ? true : getOfferKind(offer) === filterType
      ),
    [offers, filterType]
  );

  const formatPrice = (raw: Offer["prix"]) => {
    const value =
      typeof raw === "string" ? parseFloat(raw || "0") : Number(raw ?? 0);
    return value.toLocaleString("fr-FR", {
      style: "currency",
      currency: "EUR",
    });
  };

  const formatPeopleLabel = (offer: Offer) => {
    const kind = getOfferKind(offer);
    switch (kind) {
      case "SOLO":
        return "1 personne";
      case "DUO":
        return "2 personnes";
      case "FAMILLE":
        return "4 personnes";
      default:
        return offer.nb_personnes
          ? `${offer.nb_personnes} personnes`
          : "Nombre de personnes variable";
    }
  };

  const formatStatusLabel = (offer: Offer) => {
    if (offer.statut === "DISPONIBLE") {
      if (offer.stock_disponible <= 0) return "Stock épuisé";
      return "Disponible";
    }
    if (offer.statut === "EPUISEE") return "Épuisée";
    return "Indisponible";
  };

  const isOfferAvailable = (offer: Offer) => {
    return offer.statut === "DISPONIBLE" && offer.stock_disponible > 0;
  };

  // Ajouter une offre au panier
  const handleAddToCart = async (offer: Offer) => {
    if (!isOfferAvailable(offer)) return;

    if (!isAuthenticated) {
      // Utilisateur non connecté → redirection vers login
      navigate("/login", {
        state: { from: "/offres", selectedOfferId: offer.id },
      });
      return;
    }

    try {
      setLoadingAddId(offer.id);
      setError(null);

      await api.post("/paniers/add/", {
        offre: offer.id,
        quantite: 1,
      });

      // Pour l’instant simple feedback, tu pourras brancher un toast
      // ou rediriger vers la page panier si tu veux
      // ex: navigate("/mon-espace/panier");
      alert("Offre ajoutée à votre panier.");
    } catch (err) {
      console.error(err);
      setError("Impossible d’ajouter l’offre au panier.");
    } finally {
      setLoadingAddId(null);
    }
  };

  return (
    <div className="offers-page">
      {/* Bandeau / intro */}
      <section className="offers-page__hero">
        <div className="offers-page__hero-inner">
          <h1 className="offers-page__title">Offres disponibles</h1>
          <p className="offers-page__subtitle">
            Choisissez une offre Solo, Duo ou Famille pour assister aux
            épreuves des Jeux Olympiques Paris 2024. Chaque offre correspond à
            un nombre de personnes et à un tarif adapté.
          </p>

          <div className="offers-page__summary-grid">
            <div className="offers-page__summary-card">
              <h2>Offre Solo</h2>
              <p>1 personne – idéale pour vivre une épreuve en solo.</p>
            </div>
            <div className="offers-page__summary-card">
              <h2>Offre Duo</h2>
              <p>2 personnes – partagez l’émotion des Jeux à deux.</p>
            </div>
            <div className="offers-page__summary-card">
              <h2>Offre Famille</h2>
              <p>4 personnes – une expérience olympique en famille.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Filtres + liste */}
      <section className="offers-page__content">
        <div className="offers-page__inner">
          {/* Filtres type d’offres */}
          <div className="offers-page__filters">
            <span className="offers-page__filters-label">
              Type d&apos;offre :
            </span>
            <div className="offers-page__filters-buttons">
              <button
                type="button"
                className={`offers-page__filter-btn ${
                  filterType === "ALL"
                    ? "offers-page__filter-btn--active"
                    : ""
                }`}
                onClick={() => setFilterType("ALL")}
              >
                Toutes
              </button>
              <button
                type="button"
                className={`offers-page__filter-btn ${
                  filterType === "SOLO"
                    ? "offers-page__filter-btn--active"
                    : ""
                }`}
                onClick={() => setFilterType("SOLO")}
              >
                Solo
              </button>
              <button
                type="button"
                className={`offers-page__filter-btn ${
                  filterType === "DUO"
                    ? "offers-page__filter-btn--active"
                    : ""
                }`}
                onClick={() => setFilterType("DUO")}
              >
                Duo
              </button>
              <button
                type="button"
                className={`offers-page__filter-btn ${
                  filterType === "FAMILLE"
                    ? "offers-page__filter-btn--active"
                    : ""
                }`}
                onClick={() => setFilterType("FAMILLE")}
              >
                Famille
              </button>
            </div>
          </div>

          {/* États de chargement / erreur */}
          {loading && (
            <div className="offers-page__state">
              <p>Chargement des offres en cours…</p>
            </div>
          )}

          {error && !loading && (
            <div className="offers-page__state offers-page__state--error">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && filteredOffers.length === 0 && (
            <div className="offers-page__state">
              <p>Aucune offre disponible pour le moment.</p>
            </div>
          )}

          {/* Grille d’offres */}
          {!loading && !error && filteredOffers.length > 0 && (
            <div className="offers-page__grid">
              {filteredOffers.map((offer) => {
                const kind = getOfferKind(offer);
                const statusLabel = formatStatusLabel(offer);
                const available = isOfferAvailable(offer);
                const isAdding = loadingAddId === offer.id;

                return (
                  <article key={offer.id} className="offer-card">
                    <header className="offer-card__header">
                      <span className={`offer-card__badge offer-card__badge--${kind.toLowerCase()}`}>
                        {kind === "SOLO"
                          ? "Solo"
                          : kind === "DUO"
                          ? "Duo"
                          : kind === "FAMILLE"
                          ? "Famille"
                          : offer.type_offre}
                      </span>
                      <h2 className="offer-card__title">{offer.nom_offre}</h2>
                    </header>

                    <p className="offer-card__description">
                      {offer.description ||
                        "Offre spéciale pour assister à une ou plusieurs épreuves des Jeux Olympiques."}
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
                        <dt>Stock disponible</dt>
                        <dd>
                          {offer.stock_disponible > 0
                            ? `${offer.stock_disponible} places`
                            : "Complet"}
                        </dd>
                      </div>
                      <div className="offer-card__detail-row">
                        <dt>Statut</dt>
                        <dd>{statusLabel}</dd>
                      </div>
                    </dl>

                    <div className="offer-card__actions">
                      <button
                        type="button"
                        className="offer-card__cta"
                        disabled={!available || isAdding}
                        onClick={() => handleAddToCart(offer)}
                      >
                        {isAdding
                          ? "Ajout en cours..."
                          : available
                          ? "Ajouter au panier"
                          : "Indisponible"}
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
