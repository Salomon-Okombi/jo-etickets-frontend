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
  // Fallback image géré côté FRONTEND
  const imageSrc = event.image_url ?? "/images/event-default.jpg";

  return (
    <div
      className={`card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition ${className ?? ""}`}
    >
      {/* IMAGE */}
      <figure className="relative h-44 overflow-hidden">
        <img
          src={imageSrc}
          alt={event.nom_evenement}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </figure>

      <div className="card-body gap-3">
        {/*  TITRE + BADGE */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="card-title text-base sm:text-lg leading-snug">
            {event.nom_evenement}
          </h3>
          {event.discipline && <Badge>{event.discipline}</Badge>}
        </div>

        {/* INFOS */}
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

        {/* DESCRIPTION */}
        {event.description_courte && (
          <p className="text-sm line-clamp-3 opacity-90">
            {event.description_courte}
          </p>
        )}

        {/* CTA */}
        {showCTA && (
          <div className="card-actions justify-end pt-2">
            <Link to={`/evenements/${event.id}`}>
              <Button
                variant="primary"
                aria-label={`Voir l'événement ${event.nom_evenement}`}
              >
                Voir l’événement
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}