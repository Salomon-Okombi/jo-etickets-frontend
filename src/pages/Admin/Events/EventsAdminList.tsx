// src/pages/Admin/Events/EventAdminList.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listEvents, deleteEvent } from "@/api/events.api";
import type { Event } from "@/api/events.api";

export default function EventAdminList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    try {
      // Si backend paginé: listEvents({page:1}) puis data.results
      const data = await listEvents();
      // @ts-expect-error – si listEvents renvoie Paginated<Event>, adapter ici:
      const rows: Event[] = Array.isArray(data) ? data : data.results;
      setEvents(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onDelete(id: number) {
    const ok = window.confirm("Confirmer la suppression de cet événement ?");
    if (!ok) return;
    setDeletingId(id);
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Événements — Administration</h1>
        <Link to="/admin/events/create" className="btn btn-primary">➕ Créer</Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : events.length === 0 ? (
        <div className="alert">
          <span>Aucun événement pour l’instant.</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Discipline</th>
                <th>Date</th>
                <th>Lieu</th>
                <th className="w-40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id}>
                  <td className="font-medium">{ev.nom}</td>
                  <td>{ev.discipline_sportive}</td>
                  <td>{ev.date_evenement}</td>
                  <td>{ev.lieu_evenement}</td>
                  <td className="flex gap-2 justify-end">
                    <button
                      className="btn btn-sm"
                      onClick={() => navigate(`/admin/events/${ev.id}/edit`)}
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      className="btn btn-sm btn-error"
                      disabled={deletingId === ev.id}
                      onClick={() => onDelete(ev.id)}
                    >
                      {deletingId === ev.id ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        "Supprimer"
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
