//src/pages/Public/EventsListPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "@/utils/http";
import type { Offer } from "@/types/offers";
import { useAuth } from "@/hooks/useAuth";

type EventItem = {
  id: number;
  nom_evenement: string;
  description_courte: string;
  image_url?: string | null;
  lieu: string;
  date_evenement: string;
  heure_evenement?: string | null;
  discipline?: string | null;
};

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

const FALLBACK_IMAGE = "/images/event-default.jpg";

const EventsListPage: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [addingId, setAddingId] = useState<number | null>(null);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function fetchEvents() {
      try {
        setLoading(true);
        setError(null);

        const params: Record<string, string> = {};
        const q = searchParams.get("q");

        if (q) {
          params.search = q;
          setSearch(q);
        }

        const { data } = await api.get<Paginated<EventItem>>(
          "/evenements/",
          { params }
        );

        if (!mounted) return;
        setEvents(data.results);
      } catch {
        if (mounted) {
          setError("Impossible de charger les épreuves.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchEvents();
    return () => {
      mounted = false;
    };
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search.trim()
      ? setSearchParams({ q: search.trim() })
      : setSearchParams({});
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatTime = (event: EventItem) => {
    if (!event.heure_evenement) return null;
    const [h, m] = event.heure_evenement.split(":");
    const d = new Date();
    d.setHours(Number(h), Number(m || 0));
    return d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleAddToCart = async (event: EventItem) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/evenements" } });
      return;
    }

    try {
      setAddingId(event.id);

      const { data } = await api.get<Paginated<Offer>>("/offres/", {
        params: { evenement: event.id, statut: "DISPONIBLE" },
      });

      const offers = data.results;
      if (!offers.length) {
        setError("Aucune offre disponible pour cette épreuve.");
        return;
      }

      const bestOffer = offers.reduce((a, b) =>
        Number(b.prix) < Number(a.prix) ? b : a
      );

      await api.post("/paniers/add/", {
        offre: bestOffer.id,
        quantite: 1,
      });
    } catch {
      setError("Impossible d’ajouter l’offre au panier.");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="events-page">
      <section className="events-page__hero">
        <div className="events-page__hero-inner">
          <h1 className="events-page__title">Épreuves et événements</h1>
          <p className="events-page__subtitle">
            Parcourez la billetterie officielle et choisissez les épreuves.
          </p>

          <form className="events-page__search" onSubmit={handleSearchSubmit}>
            <input
              className="events-page__search-input"
              type="text"
              placeholder="Rechercher une épreuve"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="events-page__search-btn" type="submit">
              Rechercher
            </button>
          </form>
        </div>
      </section>

      <section className="events-page__content">
        <div className="events-page__inner">
          {loading && <div>Chargement…</div>}
          {error && <div>{error}</div>}

          <div className="events-page__grid">
            {events.map((event) => {
              const imageSrc =
                event.image_url && event.image_url.trim() !== ""
                  ? event.image_url
                  : FALLBACK_IMAGE;

              return (
                <article key={event.id} className="event-card">
                  <img
                    src={imageSrc}
                    alt={event.nom_evenement}
                    className="event-card__image"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                    }}
                  />

                  <header className="event-card__header">
                    <div className="event-card__date">
                      {formatDate(event.date_evenement)}
                      {formatTime(event) && ` · ${formatTime(event)}`}
                    </div>

                    <h2 className="event-card__title">
                      {event.nom_evenement}
                    </h2>

                    {event.discipline && (
                      <div className="event-card__discipline">
                        {event.discipline}
                      </div>
                    )}
                  </header>

                  <p className="event-card__description">
                    {event.description_courte}
                  </p>

                  <div className="event-card__actions">
                    <Link
                      to={`/evenements/${event.id}`}
                      className="event-card__link"
                    >
                      Plus de détails
                    </Link>

                    <button
                      className="event-card__cta"
                      onClick={() => handleAddToCart(event)}
                      disabled={addingId === event.id}
                    >
                      {addingId === event.id
                        ? "Ajout en cours"
                        : "Ajouter au panier"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default EventsListPage;