// src/pages/Admin/Events/EventsAdminList.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/api/axiosClient";

interface AdminEvent {
  id: number;
  nom: string;
  discipline_sportive: string;
  date_evenement: string;   // "2025-08-10"
  lieu_evenement: string;
  description?: string | null;
}

const EventsAdminList: React.FC = () => {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<AdminEvent[]>("/evenements/");
      setEvents(data);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les événements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return events;
    return events.filter((ev) =>
      [ev.nom, ev.discipline_sportive, ev.lieu_evenement]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [events, search]);

  const handleDelete = async (id: number) => {
    const ok = window.confirm(
      "Confirmer la suppression de cet événement ? Cette action est définitive."
    );
    if (!ok) return;

    try {
      await api.delete(`/evenements/${id}/`);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression de l’événement.");
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête page */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Gestion des événements
          </h1>
          <p className="text-sm text-gray-300 mt-1 max-w-xl">
            Crée, modifie et supprime les épreuves olympiques disponibles sur la
            billetterie publique.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/evenements/nouveau")}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-amber-400 text-slate-950 px-5 py-2 text-sm font-semibold uppercase tracking-wide shadow-md hover:shadow-lg transition-shadow"
        >
          <span>＋</span> Nouvel événement
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Rechercher par nom, discipline, lieu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-slate-600 bg-slate-900/60 px-4 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
        <span className="text-xs text-slate-400">
          {filteredEvents.length} événement(s) affiché(s)
        </span>
      </div>

      {/* Contenu */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/60 shadow-md overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-slate-300">Chargement…</div>
        ) : error ? (
          <div className="p-6 text-sm text-red-400">{error}</div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-6 text-sm text-slate-300">
            Aucun événement trouvé.{" "}
            <button
              type="button"
              onClick={() => navigate("/admin/evenements/nouveau")}
              className="underline underline-offset-2 text-pink-300 hover:text-pink-200"
            >
              Créer le premier événement
            </button>
            .
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-slate-950/60 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-200">ID</th>
                  <th className="px-4 py-3 font-semibold text-slate-200">
                    Nom
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-200">
                    Discipline
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-200">
                    Date
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-200">
                    Lieu
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-200 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((ev) => (
                  <tr
                    key={ev.id}
                    className="border-b border-slate-800/80 hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3 text-slate-300">{ev.id}</td>
                    <td className="px-4 py-3 text-slate-50 font-medium">
                      {ev.nom}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {ev.discipline_sportive}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {new Date(ev.date_evenement).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {ev.lieu_evenement}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {/* Voir côté public */}
                        <Link
                          to={`/evenements/${ev.id}`}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs border border-slate-600 text-slate-100 hover:bg-slate-700/80"
                        >
                          Voir public
                        </Link>

                        {/* Modifier */}
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/admin/evenements/${ev.id}/edit`)
                          }
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs border border-amber-400/80 text-amber-300 hover:bg-amber-400/10"
                        >
                          ✏️ Modifier
                        </button>

                        {/* Supprimer */}
                        <button
                          type="button"
                          onClick={() => handleDelete(ev.id)}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs border border-red-500/80 text-red-300 hover:bg-red-500/10"
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsAdminList;
