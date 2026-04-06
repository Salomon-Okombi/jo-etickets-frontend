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
      setError("Erreur lors de la création.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page">
      <div style={{ marginBottom: "1.2rem" }}>
        <div className="admin-title">Créer un événement</div>
        <div className="admin-subtitle">
          Création d’une épreuve affichée dans la boutique.
        </div>
      </div>

      {error && (
        <div className="admin-alert" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <div className="admin-table-wrap" style={{ padding: "1rem" }}>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: "1rem", maxWidth: 820 }}>
          {/* Ligne 1 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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

          <div>
            <div className="admin-text-muted">Description courte</div>
            <textarea
              className="admin-input"
              style={{ minHeight: 100 }}
              value={descriptionCourte}
              onChange={(e) => setDescriptionCourte(e.target.value)}
            />
          </div>

          <div>
            <div className="admin-text-muted">Description longue</div>
            <textarea
              className="admin-input"
              style={{ minHeight: 130 }}
              value={descriptionLongue}
              onChange={(e) => setDescriptionLongue(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <div className="admin-text-muted">Image</div>
              <input
                type="file"
                accept="image/*"
                className="admin-input"
                onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              />
            </div>

            <div>
              <div className="admin-text-muted">Statut</div>
              <select
                className="admin-select"
                value={statut}
                onChange={(e) => setStatut(e.target.value as EventStatus)}
              >
                <option value="BROUILLON">Brouillon</option>
                <option value="PUBLIE">Publié</option>
                <option value="ARCHIVE">Archivé</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
            <Link to="/admin/evenements" className="admin-btn admin-btn--ghost">
              Annuler
            </Link>
            <button type="submit" className="admin-btn" disabled={saving}>
              {saving ? "Création…" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}