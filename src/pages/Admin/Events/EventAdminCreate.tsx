// src/pages/Admin/Events/EventAdminCreate.tsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/api/axiosClient";

const EventAdminCreate: React.FC = () => {
  const navigate = useNavigate();

  const [nom, setNom] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [dateEvenement, setDateEvenement] = useState(""); // YYYY-MM-DD
  const [lieu, setLieu] = useState("");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Petit minimum de validation
    if (!nom.trim() || !discipline.trim() || !dateEvenement || !lieu.trim()) {
      setError("Merci de remplir tous les champs obligatoires.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/evenements/", {
        nom,
        discipline_sportive: discipline,
        date_evenement: dateEvenement,
        lieu_evenement: lieu,
        description: description || null,
      });

      navigate("/admin/evenements");
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la création de l’événement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Nouvel événement
          </h1>
          <p className="text-sm text-gray-300 mt-1 max-w-xl">
            Crée une nouvelle épreuve qui sera ensuite visible dans la
            billetterie publique et associable à des offres.
          </p>
        </div>

        <Link
          to="/admin/evenements"
          className="text-xs md:text-sm rounded-full border border-slate-500 px-4 py-2 text-slate-200 hover:bg-slate-800/70"
        >
          ⬅ Retour à la liste
        </Link>
      </div>

      {/* Formulaire */}
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-slate-700 bg-slate-900/70 p-5 shadow-md"
      >
        {error && (
          <div className="rounded-lg border border-red-500/70 bg-red-500/10 px-4 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-300 mb-1">
              Nom de l&apos;événement *
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Finale 100m hommes"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-300 mb-1">
              Discipline sportive *
            </label>
            <input
              type="text"
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Athlétisme, Natation..."
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-300 mb-1">
              Date de l&apos;événement *
            </label>
            <input
              type="date"
              value={dateEvenement}
              onChange={(e) => setDateEvenement(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-300 mb-1">
              Lieu *
            </label>
            <input
              type="text"
              value={lieu}
              onChange={(e) => setLieu(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Stade de France..."
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-300 mb-1">
            Description (optionnelle)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-600 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="Infos pratiques, contexte de l’épreuve, etc."
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            to="/admin/evenements"
            className="rounded-full border border-slate-500 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800/70"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-amber-400 text-slate-950 px-5 py-2 text-sm font-semibold uppercase tracking-wide shadow-md hover:shadow-lg disabled:opacity-60"
          >
            {submitting ? "Enregistrement..." : "Créer l’événement"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventAdminCreate;
