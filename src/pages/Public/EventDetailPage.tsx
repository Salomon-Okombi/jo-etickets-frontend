// src/pages/Events/EventDetailPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
  quota_billets_restant: number;
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
  return n.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });
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
        setError("Impossible de charger le détail.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (Number.isFinite(eventId) && eventId > 0) loadAll();
    else {
      setLoading(false);
      setError("Identifiant invalide.");
    }

    return () => {
      mounted = false;
    };
  }, [eventId]);

  useEffect(() => {
    if (!reserveRequested || !offersRef.current || loading) return;
    offersRef.current.scrollIntoView({ behavior: "smooth" });
  }, [reserveRequested, loading]);

  const offersByCategorieId = useMemo(() => {
    const map = new Map<number, OfferApi>();
    offers.forEach((o) => map.set(Number(o.categorie), o));
    return map;
  }, [offers]);

  const sortedCats = useMemo(
    () =>
      [...cats].sort(
        (a, b) => (a.ordre_affichage ?? 0) - (b.ordre_affichage ?? 0)
      ),
    [cats]
  );

  function handleAddOffer(offer: OfferApi, category: OfferCategory) {
    addItem({
      offre: offer.id,
      quantite: 1,
      nom_offre:
        offer.nom_offre ??
        `${category.code} - ${event?.nom_evenement ?? ""}`,
      prix: offer.prix_calcule,
      nb_personnes: category.nb_personnes,
    });

    navigate("/panier");
  }

  if (loading) return <div>Chargement…</div>;
  if (!event) return <div>{error}</div>;

  const actif = isEventActive(event);

  const imageSrc =
    event.image_url && event.image_url.trim() !== ""
      ? event.image_url
      : FALLBACK_IMAGE;

  return (
    <div>
      {/* ✅ IMAGE */}
      <div style={{ marginBottom: 16 }}>
        <img
          src={imageSrc}
          alt={event.nom_evenement}
          style={{
            width: "100%",
            maxHeight: 300,
            objectFit: "cover",
            borderRadius: 8,
          }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
          }}
        />
      </div>

      <h1>{event.nom_evenement}</h1>

      <p>
        {formatDateTime(event.date_debut)} → {formatDateTime(event.date_fin)}
      </p>

      <p>Prix : {fmtMoney(event.prix_base)}</p>

      <button disabled={!actif}>Réserver</button>

      <div ref={offersRef}>
        {sortedCats.map((c) => {
          const offer = offersByCategorieId.get(c.id);

          const disabled =
            !actif ||
            !offer ||
            !offer.est_disponible ||
            (offer.quota_billets_restant ?? 0) <= 0;

          return (
            <div key={c.id}>
              <h3>{c.nom}</h3>

              <p>
                {offer
                  ? `${offer.quota_billets_restant} places restantes`
                  : "—"}
              </p>

              <button
                disabled={disabled}
                onClick={() => offer && handleAddOffer(offer, c)}
              >
                Ajouter au panier
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}