import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "@/utils/http";
import type { Offer } from "@/types/offers";
import { useAuth } from "@/hooks/useAuth";

/* ============================================================
   Types
============================================================ */

type EventItem = {
  id: number;
  nom_evenement: string;
  description: string | null;
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

/* ============================================================
   Page
============================================================ */

const EventsListPage: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const [addingId, setAddingId] = useState<number | null>(null);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  /* ============================
     Chargement des événements
  ============================ */

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

        const { data } = await api.get<Paginated<EventItem> | EventItem[]>(
          "/evenements/",
          { params }
        );

        if (!mounted) return;

        setEvents(Array.isArray(data) ? data : data.results);
      } catch {
        if (mounted) {
          setError("Impossible de charger les événements pour le moment.");
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

  /* ============================
     Helpers
  ============================ */

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
    const [h, m] = event.heure_evenement.split(":");
    const date = new Date();
    date.setHours(Number(h), Number(m || 0), 0, 0);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (raw: Offer["prix"]) => {
    const v = typeof raw === "string" ? Number(raw) : Number(raw ?? 0);
    return v.toLocaleString("fr-FR", {
      style: "currency",
      currency: "EUR",
    });
  };

  /* ============================
     Ajout au panier
  ============================ */

  const handleAddToCart = async (event: EventItem) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/evenements" } });
      return;
    }

    try {
      setAddingId(event.id);
      setError(null);

      const { data } = await api.get<Paginated<Offer> | Offer[]>("/offres/", {
        params: { evenement: event.id, statut: "DISPONIBLE" },
      });

      const offers = Array.isArray(data) ? data : data.results;

      if (!offers.length) {
        setError("Aucune offre disponible pour cet événement.");
        return;
      }

      const bestOffer = offers.reduce((min, cur) =>
        Number(cur.prix) < Number(min.prix) ? cur : min
      );

      await api.post("/paniers/add/", {
        offre: bestOffer.id,
        quantite: 1,
      });
    } catch {
      setError("Impossible d’ajouter une offre au panier.");
    } finally {
      setAddingId(null);
    }
  };

  /* ============================
     Render
  ============================ */

  return (
    <div className="events-page">
      <section className="events-hero">
        <div className="events-hero__inner">
          <h1 className="events-hero__title">Épreuves olympiques</h1>

          <p className="events-hero__subtitle">
            Sélectionnez une épreuve et réservez vos billets en toute simplicité.
          </p>

          <form className="events-search" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Rechercher une discipline ou une épreuve"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit">Rechercher</button>
          </form>
        </div>
      </section>

      <section className="events-content">
        {loading && <div className="events-state">Chargement des événements…</div>}

        {error && <div className="events-error">{error}</div>}

        {!loading && !error && events.length === 0 && (
          <div className="events-state">Aucune épreuve disponible.</div>
        )}

        <div className="events-grid">
          {events.map((event) => (
            <article key={event.id} className="event-card">
              <header className="event-card__header">
                <h2 className="event-card__title">
                  {event.nom_evenement}
                </h2>
                <div className="event-card__meta">
                  {formatDate(event.date_evenement)}
                  {formatTime(event) && ` · ${formatTime(event)}`}
                </div>
              </header>

              {event.description && (
                <p className="event-card__description">
                  {event.description}
                </p>
              )}

              <footer className="event-card__footer">
                <Link
                  to={`/evenements/${event.id}`}
                  className="event-card__link"
                >
                  Voir les détails
                </Link>

                <button
                  className="event-card__button"
                  onClick={() => handleAddToCart(event)}
                  disabled={addingId === event.id}
                >
                  {addingId === event.id
                    ? "Ajout en cours…"
                    : "Ajouter au panier"}
                </button>
              </footer>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default EventsListPage;