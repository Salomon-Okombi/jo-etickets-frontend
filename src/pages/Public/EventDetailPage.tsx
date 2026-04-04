import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "@/utils/http";
import { useAuth } from "@/hooks/useAuth";

type EventDetail = {
  id: number;
  nom_evenement: string;
  description_longue: string;
  image_url: string;
  lieu: string;
  date_evenement: string;
  heure_evenement?: string | null;
  discipline?: string | null;
};

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchEvent() {
      try {
        setLoading(true);
        setError(null);

        const { data } = await api.get<EventDetail>(`/evenements/${id}/`);
        if (!mounted) return;

        setEvent(data);
      } catch {
        if (mounted) {
          setError("Impossible de charger le détail de l’événement.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchEvent();
    return () => {
      mounted = false;
    };
  }, [id]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const formatTime = (heure?: string | null) => {
    if (!heure) return null;
    const [h, m] = heure.split(":");
    const d = new Date();
    d.setHours(Number(h), Number(m || 0));
    return d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleReserve = () => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: `/evenements/${id}` },
      });
      return;
    }

    // Point 2 : sélection de l’offre
    navigate(`/evenements/${id}/reserver`);
  };

  if (loading) {
    return (
      <div className="event-detail">
        <div className="event-detail__state">Chargement…</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="event-detail">
        <div className="event-detail__state event-detail__state--error">
          {error ?? "Événement introuvable."}
        </div>
      </div>
    );
  }

  return (
    <div className="event-detail">
      <section className="event-detail__hero">
        <div className="event-detail__hero-inner">
          <nav className="event-detail__breadcrumbs">
            <Link to="/evenements">Événements</Link> /{" "}
            <span>{event.nom_evenement}</span>
          </nav>

          <div className="event-detail__date">
            {formatDate(event.date_evenement)}
            {formatTime(event.heure_evenement) &&
              ` • ${formatTime(event.heure_evenement)}`}
          </div>

          <h1 className="event-detail__title">
            {event.nom_evenement}
          </h1>

          <div className="event-detail__meta">
            {event.discipline && <span>{event.discipline}</span>}
            <span>{event.lieu}</span>
          </div>

          <p className="event-detail__description">
            {event.description_longue}
          </p>
        </div>
      </section>

      <section className="event-detail__content">
        <div className="event-detail__content-inner">
          <div className="event-detail__image-wrapper">
            <img
              src={event.image_url}
              alt={event.nom_evenement}
              className="event-detail__image"
            />
          </div>

          <div className="event-detail__actions">
            <button
              className="event-card__cta"
              onClick={handleReserve}
            >
              Réserver
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EventDetailPage;