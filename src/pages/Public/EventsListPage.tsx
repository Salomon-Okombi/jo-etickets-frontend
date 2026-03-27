import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "@/utils/http";
import type { Offer } from "@/types/offers";
import { useAuth } from "@/hooks/useAuth";

/* ============================================================
   Types locaux
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
  ============================= */

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
        } else {
          setEvents(data.results);
        }
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
  ============================= */

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
    const value = typeof raw === "string" ? Number(raw) : Number(raw ?? 0);
    return value.toLocaleString("fr-FR", {
      style: "currency",
      currency: "EUR",
    });
  };

  /* ============================
     Ajout au panier
  ============================= */

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
        params: { evenement: event.id, statut: "DISPONIBLE" },
      });

      const offers = Array.isArray(data) ? data : data.results;

      if (!offers.length) {
        alert("Aucune offre disponible pour cet événement.");
        return;
      }

      const bestOffer = offers.reduce((min, current) => {
        const pMin = Number(min.prix ?? 0);
        const pCur = Number(current.prix ?? 0);
        return pCur < pMin ? current : min;
      });

      await api.post("/paniers/add/", {
        offre: bestOffer.id,
        quantite: 1,
      });

      alert(
        `Offre ajoutée au panier (à partir de ${formatPrice(bestOffer.prix)}).`
      );
    } catch {
      setError("Impossible d’ajouter une offre au panier.");
    } finally {
      setAddingId(null);
    }
  };

  /* ============================
     Render
  ============================= */

  return (
    <div className="events-page">
      <section className="events-page__hero">
        <div className="events-page__hero-inner">
          <h1 className="events-page__title">Épreuves & événements</h1>

          <form className="events-page__search" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Rechercher une épreuve…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit">Rechercher</button>
          </form>
        </div>
      </section>

      <section className="events-page__content">
        {loading && <p>Chargement…</p>}
        {error && <p>{error}</p>}

        {!loading && !error && events.length === 0 && (
          <p>Aucune épreuve disponible.</p>
        )}

        <div className="events-page__grid">
          {events.map((event) => (
            <article key={event.id} className="event-card">
              <h2>{event.nom_evenement}</h2>
              <p>
                {formatDate(event.date_evenement)}
                {formatTime(event) && ` · ${formatTime(event)}`}
              </p>

              <div className="event-card__actions">
                <Link to={`/evenements/${event.id}`}>
                  Détails de l’épreuve
                </Link>

                <button
                  onClick={() => handleAddToCart(event)}
                  disabled={addingId === event.id}
                >
                  {addingId === event.id
                    ? "Ajout en cours…"
                    : "Ajouter au panier"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default EventsListPage;