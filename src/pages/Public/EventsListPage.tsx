// src/pages/Events/EventsListPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "@/api/axiosClient";

type EventItem = {
  id: number;
  nom_evenement: string;
  description_courte: string;
  description_longue?: string;
  image_url?: string | null;
  lieu: string;
  date_debut: string;
  date_fin: string;
  discipline?: string | null;
  prix_base?: number | string;
};

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

const FALLBACK_IMAGE = "/images/event-default.jpg";

/* ===============================
   HELPERS
=============================== */

function unwrap<T>(data: any): T[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

function fmtMoney(v?: number | string) {
  if (v === undefined || v === null) return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EventsListPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
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

        const { data } = await api.get<Paginated<EventItem> | EventItem[]>(
          "/evenements/",
          { params }
        );

        if (!mounted) return;
        setEvents(unwrap<EventItem>(data));
      } catch {
        if (!mounted) return;
        setError("Impossible de charger les événements.");
        setEvents([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchEvents();
    return () => {
      mounted = false;
    };
  }, [searchParams]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    q ? setSearchParams({ q }) : setSearchParams({});
  }

  function handleAddToCart(eventId: number) {
    navigate(`/evenements/${eventId}?reserve=1`);
  }

  return (
    <div className="events-page">
      <section className="events-page__hero">
        <div className="events-page__hero-inner">
          <h1 className="events-page__title">Boutique</h1>
          <p className="events-page__subtitle">
            Choisissez un événement, puis sélectionnez une offre.
          </p>

          <form className="events-page__search" onSubmit={handleSearchSubmit}>
            <input
              className="events-page__search-input"
              type="text"
              placeholder="Rechercher un événement"
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
                      {formatDateTime(event.date_debut)} →{" "}
                      {formatDateTime(event.date_fin)}
                    </div>

                    <h2 className="event-card__title">
                      {event.nom_evenement}
                    </h2>

                    {event.discipline && (
                      <div className="event-card__discipline">
                        {event.discipline}
                      </div>
                    )}

                    <div style={{ opacity: 0.85, marginTop: 6 }}>
                      Prix de base :{" "}
                      <strong>{fmtMoney(event.prix_base)}</strong>
                    </div>
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
                      type="button"
                      className="event-card__cta"
                      onClick={() => handleAddToCart(event.id)}
                    >
                      Ajouter au panier
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
}