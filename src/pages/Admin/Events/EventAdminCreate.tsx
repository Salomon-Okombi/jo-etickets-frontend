// src/pages/Admin/Events/EventAdminCreate.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/api/axiosClient";
import "@/styles/admin.css";

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

      await api.post("/admin/evenements/", {
        nom_evenement: nomEvenement.trim(),
        discipline: discipline.trim(),
        date_evenement: dateEvenement,
        lieu: lieu.trim(),
        description_courte: descriptionCourte.trim(),
        description_longue: descriptionLongue.trim(),
        statut,
      });

      navigate("/admin/evenements");
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status === 400 && data && typeof data === "object") {
        const key = Object.keys(data)[0];
        setError(`${key} : ${data[key][0]}`);
      } else if (status === 401) {
        setError("Non authentifié.");
      } else if (status === 403) {
        setError("Accès réservé aux administrateurs.");
      } else {
        setError("Erreur lors de la création de l’événement.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-title">Nouvel événement</div>
      <div className="admin-subtitle">
        Création d’une épreuve affichée dans la boutique événements.
      </div>

      <Link className="admin-btn admin-btn--ghost" to="/admin/evenements">
        ← Retour à la liste
      </Link>

      <div className="admin-table-wrap" style={{ marginTop: 16 }}>
        {error && (
          <div className="admin-alert" style={{ marginBottom: 12 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ maxWidth: 760, display: "grid", gap: 12 }}>
          <input
            className="admin-input"
            placeholder="Nom de l’événement"
            value={nomEvenement}
            onChange={(e) => setNomEvenement(e.target.value)}
          />

          <input
            className="admin-input"
            placeholder="Discipline"
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
          />

          <input
            className="admin-input"
            type="date"
            value={dateEvenement}
            onChange={(e) => setDateEvenement(e.target.value)}
          />

          <input
            className="admin-input"
            placeholder="Lieu"
            value={lieu}
            onChange={(e) => setLieu(e.target.value)}
          />

          <textarea
            className="admin-input"
            placeholder="Description courte (boutique)"
            value={descriptionCourte}
            onChange={(e) => setDescriptionCourte(e.target.value)}
          />

          <textarea
            className="admin-input"
            placeholder="Description longue (page détail)"
            value={descriptionLongue}
            onChange={(e) => setDescriptionLongue(e.target.value)}
          />

          <select
            className="admin-select"
            value={statut}
            onChange={(e) => setStatut(e.target.value as EventStatus)}
          >
            <option value="BROUILLON">Brouillon</option>
            <option value="PUBLIE">Publié</option>
            <option value="ARCHIVE">Archivé</option>
          </select>

          <button className="admin-btn" type="submit" disabled={submitting}>
            {submitting ? "Création…" : "Créer l’événement"}
          </button>
        </form>
      </div>
    </div>
  );
}