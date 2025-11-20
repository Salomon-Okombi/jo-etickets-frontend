// src/pages/Public/EventDetailPage.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "@/api/axiosClient";
import type { Offer } from "@/api/offers.api";
import { useAuth } from "@/hooks/useAuth";

type EventDetail = {
  id: number;
  nom_evenement: string;
  description: string | null;
  lieu: string;
  date_evenement: string;      // ISO
  heure_evenement?: string | null;
  discipline?: string | null;
  site?: string | null;
};

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [addingOfferId, setAddingOfferId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Formatters
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (raw?: string | null) => {
    if (!raw) return null;
    try {
      const [h, m] = raw.split(":");
      const d = new Date();
      d.setHours(Number(h), Number(m || 0), 0, 0);
      return d.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return raw;
    }
  };

  const formatPrice = (raw: Offer["prix"]) => {
    const value =
      typeof raw === "string" ? parseFloat(raw || "0") : Number(raw ?? 0);
    return value.toLocaleString("fr-FR", {
      style: "currency",
      currency: "EUR",
    });
  };

  const formatPeopleLabel = (offer: Offer) => {
    if (offer.nb_personnes === 1) return "1 personne";
    if (offer.nb_personnes === 2) return "2 personnes";
    if (offer.nb_personnes === 4) return "4 personnes";
    return offer.nb_personnes
      ? `${offer.nb_personnes} personnes`
      : "Nombre de personnes variable";
  };

  const isOfferAvailable = (offer: Offer) =>
    offer.statut === "DISPONIBLE" && offer.stock_disponible > 0;

  const formatStatusLabel = (offer: Offer) => {
    if (offer.statut === "DISPONIBLE") {
      if (offer.stock_disponible <= 0) return "Stock épuisé";
      return "Disponible";
    }
    if (offer.statut === "EPUISEE") return "Épuisée";
    return "Indisponible";
  };

  // Chargement de l'événement
  useEffect(() => {
    if (!id) return;
    let mounted = true;

    async function fetchEvent() {
      try {
        setLoadingEvent(true);
        setError(null);
        const { data } = await api.get<EventDetail>(`/evenements/${id}/`);
        if (!mounted) return;
        setEvent(data);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError("Impossible de charger cette épreuve.");
      } finally {
        if (mounted) setLoadingEvent(false);
      }
    }

    fetchEvent();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Chargement des offres associées
  useEffect(() => {
    if (!id) return;
    let mounted = true;

    async function fetchOffers() {
      try {
        setLoadingOffers(true);
        setError(null);

        const { data } = await api.get<Paginated<Offer> | Offer[]>("/offres/", {
          params: { evenement: id },
        });

        if (!mounted) return;

        if (Array.isArray(data)) {
          setOffers(data);
        } else if ("results" in data) {
          setOffers(data.results);
        } else {
          setOffers([]);
        }
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError(
          "Impossible de charger les offres associées à cette épreuve pour le moment."
        );
      } finally {
        if (mounted) setLoadingOffers(false);
      }
    }

    fetchOffers();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Ajouter une offre au panier
  const handleAddOfferToCart = async (offer: Offer) => {
    if (!isOfferAvailable(offer)) return;

    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: `/evenements/${id}`, selectedOfferId: offer.id },
      });
      return;
    }

    try {
      setAddingOfferId(offer.id);
      setError(null);

      await api.post("/paniers/add/", {
        offre: offer.id,
        quantite: 1,
      });

      alert(
        `Offre ajoutée au panier (${formatPeopleLabel(
          offer
        )}, à partir de ${formatPrice(offer.prix)}).`
      );
    } catch (err) {
      console.error(err);
      setError("Impossible d’ajouter cette offre au panier.");
    } finally {
      setAddingOfferId(null);
    }
  };

  const time = formatTime(event?.heure_evenement || null);

  return (
    <div className="event-detail">
      {/* Hero / entête */}
      <section className="event-detail__hero">
        <div className="event-detail__hero-inner">
          <div className="event-detail__breadcrumbs">
            <Link to="/evenements">← Retour aux épreuves</Link>
          </div>

          {loadingEvent && (
            <p className="event-detail__state">Chargement de l&apos;épreuve…</p>
          )}

          {!loadingEvent && event && (
            <>
              <p className="event-detail__date">
                {formatDate(event.date_evenement)}
                {time ? <span> · {time}</span> : null}
              </p>
              <h1 className="event-detail__title">
                {event.nom_evenement}
              </h1>

              <div className="event-detail__meta">
                <span>{event.lieu}</span>
                {event.site && <span>Site : {event.site}</span>}
                {event.discipline && (
                  <span>Discipline : {event.discipline}</span>
                )}
              </div>

              {event.description && (
                <p className="event-detail__description">
                  {event.description}
                </p>
              )}
            </>
          )}

          {!loadingEvent && !event && !error && (
            <p className="event-detail__state">
              Cette épreuve n&apos;existe pas ou n&apos;est pas disponible.
            </p>
          )}

          {error && (
            <p className="event-detail__state event-detail__state--error">
              {error}
            </p>
          )}
        </div>
      </section>

      {/* Offres associées */}
      <section className="event-detail__offers">
        <div className="event-detail__offers-inner">
          <h2 className="event-detail__offers-title">
            Offres disponibles pour cette épreuve
          </h2>
          <p className="event-detail__offers-subtitle">
            Choisissez une offre en fonction du nombre de personnes et du tarif
            souhaité. Les e-billets sont nominatifs et sécurisés par QR Code.
          </p>

          {loadingOffers && (
            <div className="event-detail__state">
              <p>Chargement des offres…</p>
            </div>
          )}

          {!loadingOffers && offers.length === 0 && (
            <div className="event-detail__state">
              <p>
                Aucune offre n&apos;est encore disponible pour cette épreuve. Revenez
                un peu plus tard ou explorez d&apos;autres épreuves.
              </p>
            </div>
          )}

          {!loadingOffers && offers.length > 0 && (
            <div className="event-detail__offers-grid">
              {offers.map((offer) => {
                const available = isOfferAvailable(offer);
                const statusLabel = formatStatusLabel(offer);
                const isAdding = addingOfferId === offer.id;

                return (
                  <article key={offer.id} className="offer-card">
                    <header className="offer-card__header">
                      <span className="offer-card__badge">
                        {offer.type_offre}
                      </span>
                      <h3 className="offer-card__title">
                        {offer.nom_offre}
                      </h3>
                    </header>

                    <p className="offer-card__description">
                      {offer.description ||
                        "Profitez de cette offre pour assister à l’épreuve avec des e-billets 100% numériques."}
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
                        onClick={() => handleAddOfferToCart(offer)}
                      >
                        <span
                          className="offer-card__cta-icon"
                          aria-hidden="true"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            focusable="false"
                          >
                            <path
                              d="M7 4h-.75a.75.75 0 0 0 0 1.5H7l1.1 5.5a2.25 2.25 0 0 0 2.21 1.85h6.19a2.25 2.25 0 0 0 2.21-1.85L20.75 7H18.5a.75.75 0 0 1 0-1.5h3.25a.75.75 0 0 1 .73.93l-1.3 5.84A3.75 3.75 0 0 1 16.5 15H10.3A3.75 3.75 0 0 1 6.6 12.27L5.4 6.5H3.75a.75.75 0 0 1 0-1.5H5zM10 18.25a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm8.5 0a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Z"
                              fill="currentColor"
                            />
                          </svg>
                        </span>
                        <span>
                          {isAdding
                            ? "Ajout en cours..."
                            : available
                            ? "Ajouter au panier"
                            : "Indisponible"}
                        </span>
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

export default EventDetailPage;
