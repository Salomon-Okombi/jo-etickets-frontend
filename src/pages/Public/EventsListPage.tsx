import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "@/api/axiosClient";
import { type Offer } from "@/api/offers.api";
import { useAuth } from "@/hooks/useAuth";

type EventItem = {
  id: number;
  nom_evenement: string;
  description: string | null;
  lieu: string;
  date_evenement: string; // ISO
  heure_evenement?: string | null;
  discipline?: string | null;
};

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

const EventsListPage: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const [addingId, setAddingId] = useState<number | null>(null);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Chargement des événements
  useEffect(() => {
    let mounted = true;

    async function fetchEvents() {
      try {
        setLoading(true);
        setError(null);

        const params: Record<string, string> = {};
        const searchValue = searchParams.get("q");
        if (searchValue) {
          params.search = searchValue;
          setSearch(searchValue);
        }

        const { data } = await api.get<Paginated<EventItem> | EventItem[]>(
          "/evenements/",
          { params }
        );

        if (!mounted) return;

        if (Array.isArray(data)) {
          setEvents(data);
        } else if ("results" in data) {
          setEvents(data.results);
        } else {
          setEvents([]);
        }
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError("Impossible de charger les événements pour le moment.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchEvents();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setSearchParams({ q: search.trim() });
    } else {
      setSearchParams({});
    }
  };

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

  const formatTime = (event: EventItem) => {
    if (!event.heure_evenement) return null;
    try {
      const [h, m] = event.heure_evenement.split(":");
      const date = new Date();
      date.setHours(Number(h), Number(m || 0), 0, 0);
      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return event.heure_evenement;
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

  /**
   * Lorsqu’on clique sur "Ajouter au panier" sur un événement :
   * 1. Si non connecté → redirection login
   * 2. Sinon → on récupère les offres de cet événement
   * 3. On choisit la moins chère disponible
   * 4. On appelle /paniers/add/ avec cette offre
   */
  const handleAddToCart = async (event: EventItem) => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: "/evenements", eventId: event.id },
      });
      return;
    }

    try {
      setAddingId(event.id);
      setError(null);

      const { data } = await api.get<Paginated<Offer> | Offer[]>("/offres/", {
        params: {
          evenement: event.id,
          statut: "DISPONIBLE",
        },
      });

      let offers: Offer[] = [];
      if (Array.isArray(data)) {
        offers = data;
      } else if ("results" in data) {
        offers = data.results;
      }

      if (!offers || offers.length === 0) {
        alert(
          "Aucune offre disponible pour cet événement pour le moment. Veuillez réessayer plus tard."
        );
        return;
      }

      // On choisit l’offre la moins chère
      const bestOffer = offers.reduce((min, current) => {
        const priceMin =
          typeof min.prix === "string"
            ? parseFloat(min.prix || "0")
            : Number(min.prix ?? 0);
        const priceCurrent =
          typeof current.prix === "string"
            ? parseFloat(current.prix || "0")
            : Number(current.prix ?? 0);

        return priceCurrent < priceMin ? current : min;
      }, offers[0]);

      await api.post("/paniers/add/", {
        offre: bestOffer.id,
        quantite: 1,
      });

      alert(
        `Offre ajoutée au panier (à partir de ${formatPrice(bestOffer.prix)}).`
      );
    } catch (err) {
      console.error(err);
      setError("Impossible d’ajouter une offre au panier pour cet événement.");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="events-page">
      {/* Bandeau / intro */}
      <section className="events-page__hero">
        <div className="events-page__hero-inner">
          <h1 className="events-page__title">Épreuves & événements</h1>
          <p className="events-page__subtitle">
            Parcourez les épreuves des Jeux Olympiques Paris 2024 : athlétisme,
            natation, sports collectifs, gymnastique… Sélectionnez un événement
            pour voir le détail de l&apos;épreuve ou ajouter une offre au panier.
          </p>

          {/* Barre de recherche */}
          <form className="events-page__search" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Rechercher une épreuve, une discipline, un site..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="events-page__search-input"
            />
            <button type="submit" className="events-page__search-btn">
              Rechercher
            </button>
          </form>
        </div>
      </section>

      {/* Contenu principal */}
      <section className="events-page__content">
        <div className="events-page__inner">
          {loading && (
            <div className="events-page__state">
              <p>Chargement des événements en cours…</p>
            </div>
          )}

          {error && !loading && (
            <div className="events-page__state events-page__state--error">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="events-page__state">
              <p>Aucune épreuve trouvée pour le moment.</p>
            </div>
          )}

          {!loading && !error && events.length > 0 && (
            <div className="events-page__grid">
              {events.map((event) => {
                const time = formatTime(event);
                const isAdding = addingId === event.id;

                return (
                  <article key={event.id} className="event-card">
                    <header className="event-card__header">
                      <p className="event-card__date">
                        {formatDate(event.date_evenement)}
                        {time ? <span> · {time}</span> : null}
                      </p>
                      <h2 className="event-card__title">
                        {event.nom_evenement}
                      </h2>
                      {event.discipline && (
                        <p className="event-card__discipline">
                          Discipline : {event.discipline}
                        </p>
                      )}
                    </header>

                    {event.description && (
                      <p className="event-card__description">
                        {event.description}
                      </p>
                    )}

                    <dl className="event-card__details">
                      <div className="event-card__detail-row">
                        <dt>Lieu</dt>
                        <dd>{event.lieu}</dd>
                      </div>
                    </dl>

                    <div className="event-card__actions">
                      <Link
                        to={`/evenements/${event.id}`}
                        className="event-card__link"
                      >
                        Détails de l&apos;épreuve
                      </Link>

                      <button
                        type="button"
                        className="event-card__cta"
                        onClick={() => handleAddToCart(event)}
                        disabled={isAdding}
                      >
                        <span className="event-card__cta-icon" aria-hidden="true">
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
                          {isAdding ? "Ajout en cours..." : "Ajouter au panier"}
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

export default EventsListPage;
