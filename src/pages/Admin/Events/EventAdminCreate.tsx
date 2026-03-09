// src/pages/Admin/Events/EventAdminCreate.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/api/axiosClient";
import "@/styles/admin.css";

type EventStatus = "A_VENIR" | "EN_COURS" | "TERMINE";

export default function EventAdminCreate() {
  const navigate = useNavigate();

  const [nom, setNom] = useState("");
  const [disciplineSportive, setDisciplineSportive] = useState("");
  const [dateEvenement, setDateEvenement] = useState(""); // YYYY-MM-DD (DateField)
  const [lieuEvenement, setLieuEvenement] = useState("");
  const [description, setDescription] = useState("");
  const [statut, setStatut] = useState<EventStatus>("A_VENIR");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!nom.trim()) return "Le nom de l'événement est obligatoire.";
    if (!disciplineSportive.trim()) return "La discipline sportive est obligatoire.";
    if (!dateEvenement) return "La date de l'événement est obligatoire.";
    if (!lieuEvenement.trim()) return "Le lieu de l'événement est obligatoire.";
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

      await api.post("/evenements/", {
        nom: nom.trim(),
        discipline_sportive: disciplineSportive.trim(),
        date_evenement: dateEvenement, // "YYYY-MM-DD"
        lieu_evenement: lieuEvenement.trim(),
        description: description.trim() ? description.trim() : null,
        statut, // ✅ ajout du statut (A_VENIR/EN_COURS/TERMINE)
      });

      navigate("/admin/evenements");
    } catch (err: any) {
      console.error("EventAdminCreate error:", err);

      const status = err?.response?.status;
      if (status === 400) {
        // DRF renvoie souvent un objet { field: ["message"] }
        const data = err?.response?.data;
        if (data && typeof data === "object") {
          const firstKey = Object.keys(data)[0];
          const msg = firstKey ? `${firstKey}: ${Array.isArray(data[firstKey]) ? data[firstKey][0] : String(data[firstKey])}` : "Données invalides.";
          setError(`Erreur (400) — ${msg}`);
        } else {
          setError("Erreur (400) — Données invalides.");
        }
      } else if (status === 401) {
        setError("Non authentifié (401). Connecte-toi.");
      } else if (status === 403) {
        setError("Accès refusé (403). Admin requis.");
      } else if (status === 404) {
        setError("Endpoint introuvable (404). Vérifie /api/evenements/.");
      } else {
        setError("Erreur lors de la création de l’événement.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div style={{ marginBottom: "1.2rem" }}>
        <div className="admin-title">Nouvel événement</div>
        <div className="admin-subtitle">
          Crée une nouvelle épreuve (nom, discipline, date, lieu). Elle sera ensuite visible et associable à des offres.
        </div>
      </div>

      {/* Actions header */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
        <Link className="admin-btn admin-btn--ghost" to="/admin/evenements">
          ← Retour à la liste
        </Link>
      </div>

      {/* Form */}
      <div className="admin-table-wrap" style={{ marginTop: "1rem", padding: "1rem" }}>
        {error ? (
          <div className="admin-alert" role="alert" style={{ marginBottom: "0.9rem" }}>
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.9rem", maxWidth: 760 }}>
          {/* Row 1 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                Nom de l’événement *
              </div>
              <input
                className="admin-input"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Finale 100m hommes"
              />
            </div>

            <div>
              <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                Discipline sportive *
              </div>
              <input
                className="admin-input"
                value={disciplineSportive}
                onChange={(e) => setDisciplineSportive(e.target.value)}
                placeholder="Athlétisme, Natation..."
              />
            </div>
          </div>

          {/* Row 2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                Date de l’événement *
              </div>
              <input
                className="admin-input"
                type="date"
                value={dateEvenement}
                onChange={(e) => setDateEvenement(e.target.value)}
              />
            </div>

            <div>
              <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                Statut *
              </div>
              <select className="admin-select" value={statut} onChange={(e) => setStatut(e.target.value as EventStatus)}>
                <option value="A_VENIR">A_VENIR</option>
                <option value="EN_COURS">EN_COURS</option>
                <option value="TERMINE">TERMINE</option>
              </select>
            </div>
          </div>

          {/* Row 3 */}
          <div>
            <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              Lieu *
            </div>
            <input
              className="admin-input"
              value={lieuEvenement}
              onChange={(e) => setLieuEvenement(e.target.value)}
              placeholder="Stade de France..."
            />
          </div>

          {/* Description */}
          <div>
            <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              Description (optionnelle)
            </div>
            <textarea
              className="admin-input"
              style={{ borderRadius: 16, minHeight: 120 }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Infos pratiques, contexte de l’épreuve, etc."
            />
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "0.4rem" }}>
            <Link className="admin-btn admin-btn--ghost" to="/admin/evenements">
              Annuler
            </Link>

            <button className="admin-btn" type="submit" disabled={submitting}>
              {submitting ? "Enregistrement…" : "Créer l’événement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}