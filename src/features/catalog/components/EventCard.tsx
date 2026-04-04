import React from "react";
import { Link } from "react-router-dom";
import type { Event } from "@/api/events.api";
import  Badge  from "@/components/ui/Badge";
import  Button  from "@/components/ui/Button";

type Props = {
  event: Event;
  className?: string;
  showCTA?: boolean; // affiche le bouton "Voir l'événement"
};

export default function EventCard({ event, className, showCTA = true }: Props) {
  return (
    <div
      className={`card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition ${className ?? ""}`}
    >
      <div className="card-body gap-3">
        <div className="flex items-start justify-between">
          <h3 className="card-title text-base sm:text-lg">{event.discipline}</h3>
          <Badge>{event.discipline}</Badge>
        </div>

        <div className="text-sm opacity-80 space-y-1">
          <p>
            <span className="font-medium">Date :</span>{" "}
            {new Date(event.date_evenement).toLocaleDateString("fr-FR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p>
            <span className="font-medium">Lieu :</span> {event.lieu}
          </p>
        </div>

        {event.description_courte && (
          <p className="text-sm line-clamp-3 opacity-90">{event.description_courte}</p>
        )}

        {showCTA && (
          <div className="card-actions justify-end">
            <Link to={`/events/${event.id}`}>
              <Button variant="primary" aria-label={`Voir l'événement ${event.nom_evenement}`}>
                Voir l’événement
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
