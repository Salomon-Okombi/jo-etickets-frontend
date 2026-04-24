import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "@/utils/http";
import { useCart } from "@/features/cart/useCart";
import { listOfferCategories, type OfferCategory } from "@/api/offerCategories.api";
import type { Offer } from "@/types/offers";

type EventDetail = {
  id: number;
  nom_evenement: string;
  description_longue: string;
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(heure?: string | null) {
  if (!heure) return null;
  const [h, m] = heure.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m || 0));
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatPrice(raw: number | string) {
  const n = typeof raw === "string" ? Number(raw) : raw;
  const safe = Number.isFinite(n) ? n : 0;
  return safe.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const navigate = useNavigate();

  const { addItem } = useCart();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [cats, setCats] = useState<OfferCategory[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadAll() {
      try {
        setLoading(true);
        setError(null);

        const [evRes, catRows, offersRes] = await Promise.all([
          api.get<EventDetail>(`/evenements/${eventId}/`),
          listOfferCategories(),
          api.get<Paginated<Offer> | Offer[]>(`/offres/`, {
            params: { evenement: eventId, statut: "ACTIVE" },
          }),
        ]);

        if (!mounted) return;

        setEvent(evRes.data);

        // catRows peut être un array OU un objet paginé selon ton backend
        const catList = Array.isArray(catRows)
          ? catRows
          : (catRows as any)?.results ?? [];
        setCats(catList);

        const rawOffers = offersRes.data;
        const offerList = Array.isArray(rawOffers)
          ? rawOffers
          : rawOffers.results ?? [];
        setOffers(offerList);
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

  // Map "CODE_CATEGORIE" -> offre correspondante
  const offersByCategoryCode = useMemo(() => {
    const map = new Map<string, Offer>();
    for (const o of offers) {
      const code = String(o.type_offre ?? "").toUpperCase(); // compat backend
      if (!code) continue;
      map.set(code, o);
    }
    return map;
  }, [offers]);

  // On n’affiche que les catégories qui ont réellement une offre ACTIVE pour cet événement
  const availableCats = useMemo(() => {
    const sorted = [...cats].sort(
      (a, b) => (a.ordre_affichage ?? 0) - (b.ordre_affichage ?? 0)
    );

    return sorted.filter((c) => {
      const offer = offersByCategoryCode.get(c.code.toUpperCase());
      if (!offer) return false;
      if (String(offer.statut).toUpperCase() !== "ACTIVE") return false;
      if (Number(offer.stock_disponible ?? 0) <= 0) return false;
      return true;
    });
  }, [cats, offersByCategoryCode]);

  async function handleAddOffer(offer: Offer, category: OfferCategory) {
    try {
      setAdding(offer.id);
      setError(null);

      // Ajout au panier local : l’utilisateur a choisi explicitement le type/catégorie
      addItem({
        offre: offer.id,
        quantite: 1,
        nom_offre: offer.nom_offre,
        prix: offer.prix,
        nb_personnes: category.nb_personnes,
      });

      navigate("/panier");
    } catch {
      setError("Impossible d’ajouter au panier.");
    } finally {
      setAdding(null);
    }
  }

  if (loading) return <div className="event-detail__state">Chargement…</div>;

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

  return (
    <div className="event-detail">
      <section className="event-detail__hero">
        <div className="event-detail__hero-inner">
          <nav className="event-detail__breadcrumbs">
            <Link to="/evenements">Épreuves</Link> / <span>{event.nom_evenement}</span>
          </nav>

          <div className="event-detail__date">
            {formatDate(event.date_evenement)}
            {formatTime(event.heure_evenement)
              ? ` • ${formatTime(event.heure_evenement)}`
              : ""}
          </div>

          <h1 className="event-detail__title">{event.nom_evenement}</h1>

          <div className="event-detail__meta">
            {event.discipline ? <span>{event.discipline}</span> : null}
            <span>{event.lieu}</span>
          </div>

          <p className="event-detail__description">{event.description_longue}</p>
        </div>
      </section>

      <section className="event-detail__offers">
        <div className="event-detail__offers-inner">
          {error ? (
            <div className="event-detail__state event-detail__state--error">{error}</div>
          ) : null}

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
          <p className="event-detail__offers-subtitle">
            Sélectionne le type d’offre (Solo, Duo, Famille, ou toute nouvelle catégorie ajoutée par l’admin).
          </p>

          {availableCats.length === 0 ? (
            <div className="event-detail__state">Aucune offre disponible pour cet événement.</div>
          ) : (
            <div className="event-detail__offers-grid">
              {availableCats.map((c) => {
                const code = c.code.toUpperCase();
                const offer = offersByCategoryCode.get(code)!;

                return (
                  <article key={c.id} className="offer-card">
                    <header className="offer-card__header">
                      <span
                        className={`offer-card__badge offer-card__badge--${
                          code === "FAMILIALE" ? "famille" : code.toLowerCase()
                        }`}
                      >
                        {c.nom}
                      </span>
                      <h3 className="offer-card__title">{code}</h3>
                    </header>

                    <p className="offer-card__description">
                      {c.description ?? "Catégorie d’offre."}
                    </p>

                    <dl className="offer-card__details">
                      <div className="offer-card__detail-row">
                        <dt>Billets</dt>
                        <dd>{c.nb_personnes}</dd>
                      </div>
                      <div className="offer-card__detail-row">
                        <dt>Prix</dt>
                        <dd>{formatPrice(offer.prix)}</dd>
                      </div>
                      <div className="offer-card__detail-row">
                        <dt>Stock</dt>
                        <dd>{String(offer.stock_disponible ?? 0)}</dd>
                      </div>
                    </dl>

                    <div className="offer-card__actions">
                      <button
                        type="button"
                        className="offer-card__cta"
                        disabled={adding === offer.id}
                        onClick={() => handleAddOffer(offer, c)}
                      >
                        {adding === offer.id ? "Ajout…" : "Ajouter au panier"}
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
}