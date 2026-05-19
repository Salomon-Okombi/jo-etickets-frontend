// src/pages/Events/EventDetailPage.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/api/axiosClient";
import { useCart } from "@/features/cart/useCart";
import { listOfferCategories, type OfferCategory } from "@/api/offerCategories.api";

/* ===============================
   TYPES
=============================== */

type EventDetail = {
  id: number;
  nom_evenement: string;
  description_longue: string;
  image_url?: string | null;
  lieu: string;
  date_debut: string;
  date_fin: string;
  discipline?: string | null;
  prix_base: number | string;
};

type OfferApi = {
  id: number;
  evenement: number;
  categorie: number;
  nom_offre?: string;
  prix_calcule: string;
  multiplicateur: number;
  quota_billets_restant: number;
  statut: string;
  est_disponible: boolean;
};

/* ===============================
   CONST
=============================== */

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
  if (!v) return "—";
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n)
    ? n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })
    : String(v);
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("fr-FR");
}

function isEventActive(ev: EventDetail) {
  const now = new Date();
  return new Date(ev.date_debut) <= now && now <= new Date(ev.date_fin);
}

/* ===============================
   COMPONENT
=============================== */

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);

  const navigate = useNavigate();
  const offersRef = useRef<HTMLDivElement | null>(null);
  const { addItem } = useCart();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [cats, setCats] = useState<OfferCategory[]>([]);
  const [offers, setOffers] = useState<OfferApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ===============================
     LOAD DATA
  =============================== */

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [ev, categories, off] = await Promise.all([
          api.get(`/evenements/${eventId}/`),
          listOfferCategories(),
          api.get("/offres/", { params: { evenement: eventId } }),
        ]);

        if (!mounted) return;

        setEvent(ev.data);
        setCats(categories);
        setOffers(unwrap(off.data));
      } catch (err) {
        console.error(err);
        setError("Erreur chargement événement");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (Number.isFinite(eventId) && eventId > 0) {
      loadData();
    } else {
      setError("Identifiant invalide");
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [eventId]);

  /* ===============================
     MAP OFFERS
  =============================== */

  const offersByCat = useMemo(() => {
    const map = new Map<number, OfferApi>();
    offers.forEach((o) => map.set(o.categorie, o));
    return map;
  }, [offers]);

  const sortedCats = useMemo(() => {
    return [...cats].sort(
      (a, b) => (a.ordre_affichage ?? 0) - (b.ordre_affichage ?? 0)
    );
  }, [cats]);

  /* ===============================
     ACTION
  =============================== */

  function addToCartHandler(offer: OfferApi, c: OfferCategory) {
    addItem({
      offre: offer.id,
      quantite: 1,
      nom_offre: offer.nom_offre ?? c.code,
      prix: offer.prix_calcule,
      nb_personnes: c.nb_personnes,
    });

    navigate("/panier");
  }

  /* ===============================
     STATES
  =============================== */

  if (loading) {
    return <div className="event-detail__state">Chargement…</div>;
  }

  if (!event) {
    return (
      <div className="event-detail__state event-detail__state--error">
        {error ?? "Événement introuvable"}
      </div>
    );
  }

  const actif = isEventActive(event);

  const imageSrc =
    event.image_url && event.image_url.trim() !== ""
      ? event.image_url
      : FALLBACK_IMAGE;

  /* ===============================
     UI
  =============================== */

  return (
    <div className="event-detail">

      {/* HERO */}
      <section className="event-detail__hero">
        <div className="event-detail__hero-inner">

          <h1 className="event-detail__title">
            {event.nom_evenement}
          </h1>

          <div className="event-detail__meta">
            <span>{event.lieu}</span>
            {event.discipline && <span>{event.discipline}</span>}
          </div>

          <div className="event-detail__date">
            {formatDateTime(event.date_debut)} →{" "}
            {formatDateTime(event.date_fin)}
          </div>

          <p className="event-detail__description">
            {event.description_longue}
          </p>

          <button
            className="event-card__cta"
            disabled={!actif}
            onClick={() =>
              offersRef.current?.scrollIntoView({ behavior: "smooth" })
            }
          >
            {actif ? "Réserver" : "Événement terminé"}
          </button>
        </div>
      </section>

      {/* OFFERS */}
      <section className="event-detail__offers" ref={offersRef}>
        <div className="event-detail__offers-inner">

          {/* IMAGE */}
          <div className="event-detail__image-wrapper">
            <img
              src={imageSrc}
              alt={event.nom_evenement}
              className="event-detail__image"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
              }}
            />
          </div>

          <h2 className="event-detail__offers-title">
            Choisir une offre
          </h2>

          <div className="event-detail__offers-grid">
            {sortedCats.map((c) => {
              const offer = offersByCat.get(c.id);

              const disabled =
                !offer ||
                !offer.est_disponible ||
                (offer.quota_billets_restant ?? 0) <= 0 ||
                !actif;

              return (
                <article key={c.id} className="offer-card">

                  <header className="offer-card__header">
                    <span className="offer-card__badge">
                      {c.nom}
                    </span>

                    <h3 className="offer-card__title">
                      {c.code}
                    </h3>
                  </header>

                  <div className="offer-card__description">
                    {offer ? fmtMoney(offer.prix_calcule) : "—"}
                  </div>

                  <div className="offer-card__details">
                    <div className="offer-card__detail-row">
                      <dt>Places</dt>
                      <dd>{c.nb_personnes}</dd>
                    </div>

                    <div className="offer-card__detail-row">
                      <dt>Stock</dt>
                      <dd>{offer?.quota_billets_restant ?? "—"}</dd>
                    </div>
                  </div>

                  <div className="offer-card__actions">
                    <button
                      className="offer-card__cta"
                      disabled={disabled}
                      onClick={() => offer && addToCartHandler(offer, c)}
                    >
                      {disabled ? "Indisponible" : "Ajouter"}
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
``