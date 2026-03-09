// src/pages/Admin/Events/EventAdminEdit.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "@/api/axiosClient";
import "@/styles/admin.css";

type EventStatus = "A_VENIR" | "EN_COURS" | "TERMINE";

interface AdminEvent {
  id: number;
  nom: string;
  discipline_sportive: string;
  date_evenement: string;
  lieu_evenement: string;
  description?: string | null;
  statut: EventStatus;
  date_creation?: string;
}

function normalizeDateForInput(v: string) {
  return v ? v.slice(0, 10) : "";
}

export default function EventAdminEdit() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const navigate = useNavigate();

  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [nom, setNom] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [dateEvenement, setDateEvenement] = useState("");
  const [lieu, setLieu] = useState("");
  const [description, setDescription] = useState("");
  const [statut, setStatut] = useState<EventStatus>("A_VENIR");

  /* -------------------------------------------------------
     LOAD EVENT
  ------------------------------------------------------- */
  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const { data } = await api.get<AdminEvent>(`/evenements/${eventId}/`, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        setEvent(data);
        setNom(data.nom);
        setDiscipline(data.discipline_sportive);
        setDateEvenement(normalizeDateForInput(data.date_evenement));
        setLieu(data.lieu_evenement);
        setDescription(data.description ?? "");
        setStatut(data.statut);
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404) setError("Événement introuvable.");
        else if (status === 403) setError("Accès refusé (403).");
        else setError("Impossible de charger l’événement.");
      } finally {
        setLoading(false);
      }
    }

    if (Number.isFinite(eventId)) load();
    return () => controller.abort();
  }, [eventId]);

  /* -------------------------------------------------------
     VALIDATION
  ------------------------------------------------------- */
  function validate(): string | null {
    if (!nom.trim()) return "Le nom est obligatoire.";
    if (!discipline.trim()) return "La discipline est obligatoire.";
    if (!dateEvenement) return "La date est obligatoire.";
    if (!lieu.trim()) return "Le lieu est obligatoire.";
    return null;
  }

  /* -------------------------------------------------------
     SUBMIT
  ------------------------------------------------------- */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    try {
      setSaving(true);
      await api.patch(`/evenements/${eventId}/`, {
        nom: nom.trim(),
        discipline_sportive: discipline.trim(),
        date_evenement: dateEvenement,
        lieu_evenement: lieu.trim(),
        description: description.trim() || null,
        statut,
      });

      navigate("/admin/evenements");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 400) setError("Données invalides.");
      else setError("Erreur lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  }

  /* -------------------------------------------------------
     UI
  ------------------------------------------------------- */
  if (loading) return <div className="admin-table-state">Chargement…</div>;

  if (!event) {
    return (
      <div className="admin-page">
        <div className="admin-alert">Impossible de trouver cet événement.</div>
        <Link className="admin-btn admin-btn--ghost" to="/admin/evenements">
          ← Retour
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-page">

      {/* Header */}
      <div style={{ marginBottom: "1.2rem" }}>
        <div className="admin-title">Modifier l’événement</div>
        <div className="admin-subtitle">Mise à jour de l’épreuve — ID #{event.id}</div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <Link className="admin-btn admin-btn--ghost" to="/admin/evenements">
          ← Retour à la liste
        </Link>
      </div>

      <div className="admin-table-wrap" style={{ padding: "1rem" }}>
        {error && (
          <div className="admin-alert" style={{ marginBottom: "0.9rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem", maxWidth: 700 }}>

          {/* ROW 1 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <div className="admin-text-muted">Nom *</div>
              <input className="admin-input" value={nom} onChange={(e) => setNom(e.target.value)} />
            </div>

            <div>
              <div className="admin-text-muted">Discipline sportive *</div>
              <input className="admin-input" value={discipline} onChange={(e) => setDiscipline(e.target.value)} />
            </div>
          </div>

          {/* ROW 2 */}
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
              <div className="admin-text-muted">Statut *</div>
              <select
                className="admin-select"
                value={statut}
                onChange={(e) => setStatut(e.target.value as EventStatus)}
              >
                <option value="A_VENIR">A_VENIR</option>
                <option value="EN_COURS">EN_COURS</option>
                <option value="TERMINE">TERMINE</option>
              </select>
            </div>
          </div>

          {/* LIEU */}
          <div>
            <div className="admin-text-muted">Lieu *</div>
            <input className="admin-input" value={lieu} onChange={(e) => setLieu(e.target.value)} />
          </div>

          {/* DESCRIPTION */}
          <div>
            <div className="admin-text-muted">Description</div>
            <textarea
              className="admin-input"
              style={{ borderRadius: 16, minHeight: 120 }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => navigate(-1)}>
              Annuler
            </button>

            <button type="submit" className="admin-btn" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}