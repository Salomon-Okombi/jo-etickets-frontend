// src/pages/Public/HomePage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/api/axiosClient";
import heroBg from "@/assets/images/ticket.jpg";

type HomeEvent = {
  id: number;
  nom_evenement: string;
  description_courte: string;
  image_url?: string | null;
  lieu: string;
  date_debut: string;
  discipline?: string | null;
};

const FALLBACK_IMAGE = "/images/event-default.jpg";

function isCanceledError(err: any) {
  return (
    err?.code === "ERR_CANCELED" ||
    err?.name === "CanceledError" ||
    err?.name === "AbortError"
  );
}

export default function HomePage() {
  const [events, setEvents] = useState<HomeEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadLatestEvents() {
      try {
        const { data } = await api.get<HomeEvent[]>("/evenements/latest/", {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setEvents(data);
      } catch (err: any) {
        if (isCanceledError(err) || controller.signal.aborted) return;
        setEvents([]);
      } finally {
        if (!controller.signal.aborted) setLoadingEvents(false);
      }
    }

    loadLatestEvents();
    return () => controller.abort();
  }, []);

  function formatDateTime(date: string) {
    return new Date(date).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  }

  return (
    <div className="home">
      {/* ================= HERO ================= */}
      <section
        className="home-hero"
        style={{
          backgroundImage: `
            linear-gradient(120deg, rgba(1, 14, 61, 0.9), rgba(134, 150, 200, 0.9)),
            url(${heroBg})
          `,
        }}
      >
        <div className="home-hero__content">
          <p className="home-hero__eyebrow">
            Billetterie officielle – e‑tickets sécurisés
          </p>

          <h1 className="home-hero__title">
            Vivez les Jeux Olympiques
            <span> Paris 2024</span>
          </h1>

          <p className="home-hero__subtitle">
            Réservez vos e‑billets pour les plus grandes épreuves :
            athlétisme, natation, gymnastique, sports collectifs…
          </p>

          <div className="home-hero__actions">
            <Link to="/offres" className="home-hero__cta home-hero__cta--primary">
              Découvrir les offres
            </Link>
            <Link to="/evenements" className="home-hero__cta home-hero__cta--secondary">
              Voir les épreuves
            </Link>
          </div>

          <div className="home-hero__meta">
            <span>e‑billets nominatifs</span>
            <span>Contrôle sécurisé par QR Code</span>
            <span>Pas d’attente au guichet</span>
          </div>
        </div>
      </section>

      {/* ================= COMMENT ÇA MARCHE ================= */}
      <section className="home-steps">
        <div className="home-section__inner">
          <h2 className="home-section__title">Comment ça marche ?</h2>
          <p className="home-section__subtitle">
            En quelques étapes, réservez vos places et recevez vos e‑billets.
          </p>

          <div className="home-steps__grid">
            <div className="home-step-card">
              <div className="home-step-card__number">1</div>
              <h3 className="home-step-card__title">Choisissez vos épreuves</h3>
              <p className="home-step-card__text">
                Parcourez le calendrier et sélectionnez les épreuves disponibles.
              </p>
              <Link to="/evenements" className="home-step-card__link">
                Voir les épreuves
              </Link>
            </div>

            <div className="home-step-card">
              <div className="home-step-card__number">2</div>
              <h3 className="home-step-card__title">Sélectionnez une offre</h3>
              <p className="home-step-card__text">
                Solo, Duo ou Famille selon le nombre de personnes.
              </p>
              <Link to="/offres" className="home-step-card__link">
                Voir les offres
              </Link>
            </div>

            <div className="home-step-card">
              <div className="home-step-card__number">3</div>
              <h3 className="home-step-card__title">Recevez vos e‑billets</h3>
              <p className="home-step-card__text">
                Paiement validé → billets QR Code disponibles immédiatement.
              </p>
              <Link to="/register" className="home-step-card__link">
                Créer mon compte
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TOP 3 ÉVÉNEMENTS ================= */}
      <section className="home-events">
        <div className="home-section__inner">
          <h2 className="home-section__title">Dernières épreuves ajoutées</h2>

          <p className="home-section__subtitle">
            Découvrez les 3 prochains événements disponibles
          </p>

          {loadingEvents ? (
            <div>Chargement…</div>
          ) : (
            <div className="home-events__grid">
              {events.map((event) => (
                <article key={event.id} className="home-event-card">
                  <img
                    src={event.image_url || FALLBACK_IMAGE}
                    alt={event.nom_evenement}
                    className="home-event-card__image"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                    }}
                  />

                  <div className="home-event-card__content">
                    <div className="home-event-card__date">
                      {formatDateTime(event.date_debut)}
                    </div>

                    <h3 className="home-event-card__title">{event.nom_evenement}</h3>

                    <p className="home-event-card__meta">
                      {event.lieu}
                      {event.discipline ? ` · ${event.discipline}` : ""}
                    </p>

                    <p className="home-event-card__text">{event.description_courte}</p>

                    <Link to={`/evenements/${event.id}`} className="home-event-card__link">
                      Voir l’épreuve
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="home-section__cta-row">
            <Link to="/evenements" className="home-section__link">
              Voir toutes les épreuves
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}