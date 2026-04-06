// src/pages/Admin/Events/EventAdminCreate.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/api/axiosClient";

type EventStatus = "BROUILLON" | "PUBLIE" | "ARCHIVE";

export default function EventAdminCreate() {
  const navigate = useNavigate();

  const [nomEvenement, setNomEvenement] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [dateEvenement, setDateEvenement] = useState("");
  const [lieu, setLieu] = useState("");
  const [descriptionCourte, setDescriptionCourte] = useState("");
  const [descriptionLongue, setDescriptionLongue] = useState("");
  const [statut, setStatut] = useState<EventStatus>("BROUILLON");
  const [image, setImage] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!nomEvenement.trim()) return "Le nom de l’événement est obligatoire.";
    if (!discipline.trim()) return "La discipline est obligatoire.";
    if (!dateEvenement) return "La date est obligatoire.";
    if (!lieu.trim()) return "Le lieu est obligatoire.";
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("nom_evenement", nomEvenement);
      formData.append("discipline", discipline);
      formData.append("date_evenement", dateEvenement);
      formData.append("lieu", lieu);
      formData.append("description_courte", descriptionCourte);
      formData.append("description_longue", descriptionLongue);
      formData.append("statut", statut);
      if (image) formData.append("image", image);

      await api.post("/evenements/admin/", formData);
      navigate("/admin/evenements");
    } catch {
      setError("Erreur lors de la création de l’événement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Nouvel événement
          </h1>
          <p className="text-sm text-gray-500">
            Création d’une épreuve visible dans la boutique
          </p>
        </div>

        <Link
          to="/admin/evenements"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Retour
        </Link>
      </div>

      {/* Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-sm border border-gray-200 rounded-xl p-6 space-y-6"
      >
        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-md px-4 py-3">
            {error}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nom de l’événement
            </label>
            <input
              className="mt-1 w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              value={nomEvenement}
              onChange={(e) => setNomEvenement(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Discipline
            </label>
            <input
              className="mt-1 w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date de l’événement
            </label>
            <input
              type="date"
              className="mt-1 w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              value={dateEvenement}
              onChange={(e) => setDateEvenement(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Lieu
            </label>
            <input
              className="mt-1 w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              value={lieu}
              onChange={(e) => setLieu(e.target.value)}
            />
          </div>
        </div>

        {/* Descriptions */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description courte (carte boutique)
          </label>
          <textarea
            rows={3}
            className="mt-1 w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            value={descriptionCourte}
            onChange={(e) => setDescriptionCourte(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description longue (page détail)
          </label>
          <textarea
            rows={5}
            className="mt-1 w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            value={descriptionLongue}
            onChange={(e) => setDescriptionLongue(e.target.value)}
          />
        </div>

        {/* Image + statut */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Image de l’événement
            </label>
            <input
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-sm text-gray-600
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-md file:border-0
                         file:text-sm file:font-medium
                         file:bg-indigo-50 file:text-indigo-700
                         hover:file:bg-indigo-100"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Statut
            </label>
            <select
              className="mt-1 w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              value={statut}
              onChange={(e) => setStatut(e.target.value as EventStatus)}
            >
              <option value="BROUILLON">Brouillon</option>
              <option value="PUBLIE">Publié</option>
              <option value="ARCHIVE">Archivé</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Link
            to="/admin/evenements"
            className="px-4 py-2 text-sm font-medium text-gray-700 border rounded-md hover:bg-gray-50"
          >
            Annuler
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Création…" : "Créer l’événement"}
          </button>
        </div>
      </form>
    </div>
  );
}