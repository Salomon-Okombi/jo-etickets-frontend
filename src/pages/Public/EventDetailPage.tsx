// src/pages/Events/EventDetailPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "@/api/axiosClient";
import { useCart } from "@/features/cart/useCart";
import { listOfferCategories, type OfferCategory } from "@/api/offerCategories.api";

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
  stock_disponible: number;
  statut: string;
  est_disponible: boolean;
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
  return new Date(iso).toLocaleString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const [searchParams] = useSearchParams();
  const reserveRequested = searchParams.get("reserve") === "1";

  const offersRef = useRef<HTMLDivElement | null>(null);
  const { addItem } = useCart();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [cats, setCats] = useState<OfferCategory[]>([]);
  const [offers, setOffers] = useState<OfferApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadAll() {
      try {
        setLoading(true);
        setError(null);

        const [evRes, catRows, offersRes] = await Promise.all([
          api.get<EventDetail>(`/evenements/${eventId}/`),
          listOfferCategories(),
          api.get<Paginated<OfferApi> | OfferApi[]>("/offres/", {
            params: { evenement: eventId },
          }),
        ]);

        if (!mounted) return;

        setEvent(evRes.data);
        setCats(catRows);
        setOffers(unwrap<OfferApi>(offersRes.data));
      } catch {
        if (!mounted) return;
        setError("Impossible de charger le détail et les offres.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (Number.isFinite(eventId) && eventId > 0) {
      loadAll();
    } else {
      setLoading(false);
      setError("Identifiant d’événement invalide.");
    }

    return () => {
      mounted = false;
    };
  }, [eventId]);

  useEffect(() => {
    if (!reserveRequested || !offersRef.current || loading) return;
    offersRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [reserveRequested, loading]);

  const offersByCategorieId = useMemo(() => {
    const map = new Map<number, OfferApi>();
    for (const o of offers) map.set(Number(o.categorie), o);
    return map;
  }, [offers]);

  const sortedCats = useMemo(
    () => [...cats].sort((a, b) => (a.ordre_affichage ?? 0) - (b.ordre_affichage ?? 0)),
    [cats]
  );

  function handleReserveClick() {
    if (offersRef.current) {
      offersRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handleAddOffer(offer: OfferApi, category: OfferCategory) {
    addItem({
      offre: offer.id,
      quantite: 1,
      nom_offre: offer.nom_offre ?? `${category.code} - ${event?.nom_evenement ?? ""}`,
      prix: offer.prix_calcule,
      nb_personnes: category.nb_personnes,
    });

    navigate("/panier");
  }

  if (loading) {
    return <div className="event-detail__state">Chargement…</div>;
  }

  if (!event) {
    return (
      <div className="event-detail__state event-detail__state--error">
        {error ?? "Événement introuvable."}
      </div>
    );
  }

  const imageSrc =
    event.image_url && event.image_url.trim() !== ""
      ? event.image_url
      : FALLBACK_IMAGE;

  const actif = isEventActive(event);

  return (
    <div className="event-detail">
      <section className="event-detail__hero">
        <div className="event-detail__hero-inner">
          <nav className="event-detail__breadcrumbs">
            <Link to="/evenements">Épreuves</Link> / <span>{event.nom_evenement}</span>
          </nav>

          <h1 className="event-detail__title">{event.nom_evenement}</h1>

          <div style={{ marginTop: 8 }}>
            {formatDateTime(event.date_debut)} → {formatDateTime(event.date_fin)}
          </div>

          <div style={{ marginTop: 8, fontWeight: 800 }}>
            Prix de base : {fmtMoney(event.prix_base)}
          </div>

          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              className="event-card__cta"
              disabled={!actif}
              onClick={handleReserveClick}
            >
              {actif ? "Réserver" : "Événement terminé"}
            </button>
          </div>
        </div>
      </section>

      <section className="event-detail__offers" ref={offersRef}>
        <div className="event-detail__offers-inner">
          <div className="event-detail__image-wrapper">
            <img
              src={imageSrc}
              alt={event.nom_evenement}
              className="event-detail__image"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
              }}
            />
          </div>

          <h2 className="event-detail__offers-title">Choisir une offre</h2>

          <div className="event-detail__offers-grid">
            {sortedCats.map((c) => {
              const offer = offersByCategorieId.get(c.id);
              const disabled =
                !actif ||
                !offer ||
                !offer.est_disponible ||
                offer.stock_disponible <= 0;

              return (
                <article key={c.id} className="offer-card">
                  <header className="offer-card__header">
                    <span className={`offer-card__badge offer-card__badge--${c.code.toLowerCase()}`}>
                      {c.nom}
                    </span>
                    <h3 className="offer-card__title">{c.code.toUpperCase()}</h3>
                  </header>

                  <dl className="offer-card__details">
                    <div><dt>Billets</dt><dd>{c.nb_personnes}</dd></div>
                    <div><dt>Prix</dt><dd>{offer ? fmtMoney(offer.prix_calcule) : "—"}</dd></div>
                    <div><dt>Stock</dt><dd>{offer ? offer.stock_disponible : "—"}</dd></div>
                  </dl>

                  <div className="offer-card__actions">
                    <button
                      className="offer-card__cta"
                      disabled={disabled || adding === offer?.id}
                      onClick={() => offer && handleAddOffer(offer, c)}
                    >
                      {!actif ? "Indisponible"
                        : disabled ? "Indisponible"
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
}