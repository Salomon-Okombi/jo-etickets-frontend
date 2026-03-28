// src/pages/Public/EventDetailPage.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "@/utils/http";
import type { Offer } from "@/types/offers";
import { useAuth } from "@/hooks/useAuth";

/* ============================================================
   Types locaux
============================================================ */

type EventDetail = {
  id: number;
  nom_evenement: string;
  description: string | null;
  lieu: string;
  date_evenement: string;
  heure_evenement?: string | null;
  discipline?: string | null;
  site?: string | null;
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

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [addingOfferId, setAddingOfferId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ============================================================
     Helpers
  ============================================================ */

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

  const formatTime = (raw?: string | null) => {
    if (!raw) return null;
    const [h, m] = raw.split(":");
    const d = new Date();
    d.setHours(Number(h), Number(m || 0), 0, 0);
    return d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (raw: Offer["prix"]) => {
    const value =
      typeof raw === "string" ? Number(raw || 0) : Number(raw ?? 0);
    return value.toLocaleString("fr-FR", {
      style: "currency",
      currency: "EUR",
    });
  };

  const formatPeopleLabel = (offer: Offer) => {
    if (offer.nb_personnes === 1) return "1 personne";
    if (offer.nb_personnes === 2) return "2 personnes";
    if (offer.nb_personnes === 4) return "4 personnes";
    return offer.nb_personnes
      ? `${offer.nb_personnes} personnes`
      : "Nombre de personnes variable";
  };

  /** ✅ CORRECTION CLÉ ICI */
  const isOfferAvailable = (offer: Offer) =>
    offer.stock_disponible > 0 &&
    ["ACTIVE", "DISPONIBLE"].includes(offer.statut);

  const formatStatusLabel = (offer: Offer) => {
    if (offer.statut === "ACTIVE") {
      if (offer.stock_disponible <= 0) return "Stock épuisé";
      return "Disponible";
    }
    if (offer.statut === "EPUISEE") return "Épuisée";
    return "Indisponible";
  };

  /* ============================================================
     Chargement Épreuve
  ============================================================ */

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    async function fetchEvent() {
      try {
        setLoadingEvent(true);
        setError(null);
        const { data } = await api.get<EventDetail>(`/evenements/${id}/`);
        if (mounted) setEvent(data);
      } catch {
        if (mounted) setError("Impossible de charger cette épreuve.");
      } finally {
        if (mounted) setLoadingEvent(false);
      }
    }

    fetchEvent();
    return () => {
      mounted = false;
    };
  }, [id]);

  /* ============================================================
     Chargement Offres
  ============================================================ */

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    async function fetchOffers() {
      try {
        setLoadingOffers(true);
        const { data } = await api.get<Paginated<Offer> | Offer[]>("/offres/", {
          params: { evenement: id },
        });

        if (!mounted) return;

        setOffers(Array.isArray(data) ? data : data.results);
      } catch {
        if (mounted) {
          setError("Impossible de charger les offres associées à cette épreuve.");
        }
      } finally {
        if (mounted) setLoadingOffers(false);
      }
    }

    fetchOffers();
    return () => {
      mounted = false;
    };
  }, [id]);

  /* ============================================================
     Ajout au panier
  ============================================================ */

  const handleAddOfferToCart = async (offer: Offer) => {
    if (!isOfferAvailable(offer)) return;

    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/evenements/${id}` } });
      return;
    }

    try {
      setAddingOfferId(offer.id);
      await api.post("/paniers/add/", {
        offre: offer.id,
        quantite: 1,
      });
      alert(
        `Offre ajoutée au panier (${formatPeopleLabel(
          offer
        )}, ${formatPrice(offer.prix)})`
      );
    } catch {
      setError("Impossible d’ajouter cette offre au panier.");
    } finally {
      setAddingOfferId(null);
    }
  };

  const time = formatTime(event?.heure_evenement || null);

  /* ============================================================
     Render
  ============================================================ */

  return (
    <div className="event-detail">
      {/* le JSX existant fonctionne maintenant, rien à changer */}
    </div>
  );
};

export default EventDetailPage;
``