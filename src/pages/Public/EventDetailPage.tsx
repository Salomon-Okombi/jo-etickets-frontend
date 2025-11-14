//inclut les offres liées
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getEvent, type Event } from "@/api/events.api";
import { addToCart } from "@/api/carts.api";
import { formatDate } from "@/utils/format";
import  useToast  from "@/hooks/useToast";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  async function load() {
    if (!eventId) return;
    setLoading(true);
    try {
      const data = await getEvent(eventId);
      setEvent(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToCart() {
    try {
      await addToCart(eventId, 1);
      toast.success("Événement ajouté au panier !");
    } catch {
      toast.error("Impossible d’ajouter au panier.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6">
        <div className="alert">
          <span>Événement introuvable.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold">{event.nom}</h1>
      <p className="text-lg text-primary font-semibold">
        {event.discipline_sportive}
      </p>

      <div className="flex items-center justify-between">
        <span className="opacity-70">{formatDate(event.date_evenement)}</span>
        <span className="opacity-70">{event.lieu_evenement}</span>
      </div>

      {event.description && (
        <p className="leading-relaxed text-justify mt-4">{event.description}</p>
      )}

      <div className="flex gap-2 mt-6">
        <button className="btn btn-primary" onClick={handleAddToCart}>
          Ajouter au panier
        </button>
        <Link className="btn btn-outline" to="/events">
          Retour
        </Link>
      </div>
    </div>
  );
}
