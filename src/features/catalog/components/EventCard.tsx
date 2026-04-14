//features/catalog/components/EventCard.tsx
import React from "react";
import { Link } from "react-router-dom";
import type { Event } from "@/api/events.api";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

type Props = {
  event: Event;
  className?: string;
  showCTA?: boolean;
};

export default function EventCard({
  event,
  className,
  showCTA = true,
}: Props) {
  const fallbackImage = "/images/event-default.jpg";

  const imageSrc =
    event.image_url && event.image_url.trim() !== ""
      ? event.image_url
      : fallbackImage;

  return (
    <div
      className={`card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition ${
        className ?? ""
      }`}
    >
      <figure className="h-44 overflow-hidden bg-base-200">
        <img
          src={imageSrc}
          alt={event.nom_evenement}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = fallbackImage;
          }}
        />
      </figure>

      <div className="card-body gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="card-title text-base sm:text-lg leading-snug">
            {event.nom_evenement}
          </h3>
          {event.discipline && <Badge>{event.discipline}</Badge>}
        </div>

        <div className="text-sm opacity-80 space-y-1">
          <p>
            <span className="font-medium">Date :</span>{" "}
            {new Date(event.date_evenement).toLocaleDateString("fr-FR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>

          <p>
            <span className="font-medium">Lieu :</span> {event.lieu}
          </p>
        </div>

        {event.description_courte && (
          <p className="text-sm line-clamp-3 opacity-90">
            {event.description_courte}
          </p>
        )}

        {showCTA && (
          <div className="card-actions justify-end pt-2">
            <Link to={`/evenements/${event.id}`}>
              <Button variant="primary">
                Voir l’événement
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}