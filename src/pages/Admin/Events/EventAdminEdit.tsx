//src/pages/Admin/Events/EventAdminEdit.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "@/api/axiosClient";
import "@/styles/admin.css";

type EventStatus = "BROUILLON" | "PUBLIE" | "ARCHIVE";

interface AdminEvent {
  id: number;
  nom_evenement: string;
  discipline: string;
  date_evenement: string;
  lieu: string;
  description_courte: string;
  description_longue: string;
  statut: EventStatus;
  date_creation?: string;
}

function normalizeDateForInput(v: string) {
  return v ? v.slice(0, 10) : "";
}

function isCanceledError(err: any) {
  return err?.code === "ERR_CANCELED" || err?.name === "CanceledError";
}

export default function EventAdminEdit() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nomEvenement, setNomEvenement] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [dateEvenement, setDateEvenement] = useState("");
  const [lieu, setLieu] = useState("");
  const [descriptionCourte, setDescriptionCourte] = useState("");
  const [descriptionLongue, setDescriptionLongue] = useState("");
  const [statut, setStatut] = useState<EventStatus>("BROUILLON");

  useEffect(() => {
    if (!Number.isFinite(eventId) || eventId <= 0) {
      setLoading(false);
      setError("Identifiant d’événement invalide.");
      return;
    }

    const controller = new AbortController();

    async function loadEvent() {
      try {
        setLoading(true);
        setError(null);

        const { data } = await api.get<AdminEvent>(
          `/admin/evenements/${eventId}/`,
          { signal: controller.signal }
        );

        if (controller.signal.aborted) return;

        setNomEvenement(data.nom_evenement);
        setDiscipline(data.discipline);
        setDateEvenement(normalizeDateForInput(data.date_evenement));
        setLieu(data.lieu);
        setDescriptionCourte(data.description_courte ?? "");
        setDescriptionLongue(data.description_longue ?? "");
        setStatut(data.statut);
      } catch (err: any) {
        if (isCanceledError(err)) return;

        const status = err?.response?.status;
        if (status === 401) setError("Session expirée.");
        else if (status === 403) setError("Accès refusé.");
        else if (status === 404) setError("Événement introuvable.");
        else setError("Erreur lors du chargement.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadEvent();
    return () => controller.abort();
  }, [eventId]);

  function validate(): string | null {
    if (!nomEvenement.trim()) return "Le nom est obligatoire.";
    if (!discipline.trim()) return "La discipline est obligatoire.";
    if (!dateEvenement) return "La date est obligatoire.";
    if (!lieu.trim()) return "Le lieu est obligatoire.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await api.patch(`/admin/evenements/${eventId}/`, {
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
      if (isCanceledError(err)) return;

      const status = err?.response?.status;
      if (status === 400) setError("Données invalides.");
      else if (status === 401) setError("Session expirée.");
      else if (status === 403) setError("Accès refusé.");
      else setError("Erreur lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="admin-table-state">Chargement…</div>;
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-alert">{error}</div>
        <Link to="/admin/evenements" className="admin-btn admin-btn--ghost">
          ← Retour
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-title">Modifier l’événement</div>
      <div className="admin-subtitle">
        Mise à jour d’une épreuve de la boutique
      </div>

      <Link to="/admin/evenements" className="admin-btn admin-btn--ghost">
        ← Retour à la liste
      </Link>

      <div className="admin-table-wrap" style={{ padding: "1rem" }}>
        {error && <div className="admin-alert">{error}</div>}

        <form onSubmit={handleSubmit} style={{ maxWidth: 760, display: "grid", gap: "1rem" }}>
          <input
            className="admin-input"
            value={nomEvenement}
            onChange={(e) => setNomEvenement(e.target.value)}
            placeholder="Nom de l’événement"
          />

          <input
            className="admin-input"
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
            placeholder="Discipline"
          />

          <input
            type="date"
            className="admin-input"
            value={dateEvenement}
            onChange={(e) => setDateEvenement(e.target.value)}
          />

          <input
            className="admin-input"
            value={lieu}
            onChange={(e) => setLieu(e.target.value)}
            placeholder="Lieu"
          />

          <textarea
            className="admin-input"
            style={{ minHeight: 100 }}
            value={descriptionCourte}
            onChange={(e) => setDescriptionCourte(e.target.value)}
            placeholder="Description courte (boutique)"
          />

          <textarea
            className="admin-input"
            style={{ minHeight: 140 }}
            value={descriptionLongue}
            onChange={(e) => setDescriptionLongue(e.target.value)}
            placeholder="Description longue (page détail)"
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

          <button className="admin-btn" type="submit" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      </div>
    </div>
  );
}