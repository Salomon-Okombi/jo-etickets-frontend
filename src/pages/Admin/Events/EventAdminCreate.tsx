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

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!nomEvenement.trim()) return "Le nom est obligatoire.";
    if (!discipline.trim()) return "La discipline est obligatoire.";
    if (!dateEvenement) return "La date est obligatoire.";
    if (!lieu.trim()) return "Le lieu est obligatoire.";
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSaving(true);
    setError(null);

    try {
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
      setSaving(false);
    }
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="mb-6">
        <h1 className="admin-title">Créer un événement</h1>
        <p className="admin-subtitle">
          Création d’une épreuve affichée dans la boutique.
        </p>
      </div>

      {error && (
        <div className="admin-alert mb-4">
          {error}
        </div>
      )}

      <div className="admin-table-wrap p-4">
        <form
          onSubmit={onSubmit}
          className="grid gap-4 max-w-3xl"
        >
          {/* Ligne 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="admin-text-muted">Nom de l’événement *</div>
              <input
                className="admin-input"
                value={nomEvenement}
                onChange={(e) => setNomEvenement(e.target.value)}
              />
            </div>

            <div>
              <div className="admin-text-muted">Discipline *</div>
              <input
                className="admin-input"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
              />
            </div>
          </div>

          {/* Ligne 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="admin-text-muted">Date *</div>
              <input
                type="date"
                className="admin-input"
                value={dateEvenement}
                onChange={(e) => setDateEvenement(e.target.value)}
              />
            </div>

            <div>
              <div className="admin-text-muted">Lieu *</div>
              <input
                className="admin-input"
                value={lieu}
                onChange={(e) => setLieu(e.target.value)}
              />
            </div>
          </div>

          {/* Descriptions */}
          <div>
            <div className="admin-text-muted">
              Description courte (carte boutique)
            </div>
            <textarea
              className="admin-input"
              style={{ minHeight: 100 }}
              value={descriptionCourte}
              onChange={(e) => setDescriptionCourte(e.target.value)}
            />
          </div>

          <div>
            <div className="admin-text-muted">
              Description longue (page détail)
            </div>
            <textarea
              className="admin-input"
              style={{ minHeight: 140 }}
              value={descriptionLongue}
              onChange={(e) => setDescriptionLongue(e.target.value)}
            />
          </div>

          {/* Image + statut */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="admin-text-muted">Image</div>
              <input
                type="file"
                accept="image/*"
                className="admin-input"
                onChange={(e) =>
                  setImage(e.target.files?.[0] ?? null)
                }
              />
            </div>

            <div>
              <div className="admin-text-muted">Statut</div>
              <select
                className="admin-select"
                value={statut}
                onChange={(e) =>
                  setStatut(e.target.value as EventStatus)
                }
              >
                <option value="BROUILLON">Brouillon</option>
                <option value="PUBLIE">Publié</option>
                <option value="ARCHIVE">Archivé</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Link
              to="/admin/evenements"
              className="admin-btn admin-btn--ghost"
            >
              Annuler
            </Link>

            <button
              type="submit"
              className="admin-btn"
              disabled={saving}
            >
              {saving ? "Création…" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}