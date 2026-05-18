// src/pages/Admin/Events/EventAdminEdit.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "@/api/axiosClient";
import "@/styles/admin.css";

type EventStatus = "BROUILLON" | "PUBLIE" | "ARCHIVE";

interface AdminEvent {
  id: number;
  nom_evenement: string;
  discipline: string;
  lieu: string;
  date_debut: string;
  date_fin: string;
  prix_base: string | number;
  description_courte: string | null;
  description_longue: string | null;
  statut: EventStatus;
  image_url?: string | null;
}

function isCanceledError(err: any) {
  return (
    err?.code === "ERR_CANCELED" ||
    err?.name === "CanceledError" ||
    err?.name === "AbortError"
  );
}

function toDateTimeLocal(value: string) {
  // "2026-04-30T00:17:00+02:00" -> "2026-04-30T00:17"
  return value ? value.slice(0, 16) : "";
}

function isValidDate(value: string) {
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

function extractApiError(err: any): string | null {
  const data = err?.response?.data;
  if (!data) return null;

  if (typeof data === "string") return data;
  if (Array.isArray(data)) return data.join(" ");

  if (typeof data === "object") {
    if (Array.isArray((data as any).non_field_errors) && (data as any).non_field_errors.length) {
      return (data as any).non_field_errors.join(" ");
    }
    for (const key of Object.keys(data)) {
      const val = (data as any)[key];
      if (Array.isArray(val) && val.length) return `${key} : ${val.join(" ")}`;
      if (typeof val === "string") return `${key} : ${val}`;
    }
  }
  return null;
}

export default function EventAdminEdit() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Erreur bloquante (chargement)
  const [loadError, setLoadError] = useState<string | null>(null);
  // Erreur non bloquante (validation / submit)
  const [formError, setFormError] = useState<string | null>(null);

  const [nomEvenement, setNomEvenement] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [lieu, setLieu] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [prixBase, setPrixBase] = useState("0.00");
  const [descriptionCourte, setDescriptionCourte] = useState("");
  const [descriptionLongue, setDescriptionLongue] = useState("");
  const [statut, setStatut] = useState<EventStatus>("BROUILLON");

  // Image (optionnel)
  const [image, setImage] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(eventId) || eventId <= 0) {
      setLoadError("Identifiant d’événement invalide.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadEvent() {
      try {
        setLoading(true);
        setLoadError(null);
        setFormError(null);

        const { data } = await api.get<AdminEvent>(`/evenements/admin/${eventId}/`, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (!data?.date_debut || !data?.date_fin) {
          throw new Error("date_debut/date_fin manquantes dans la réponse API");
        }

        setNomEvenement(data.nom_evenement ?? "");
        setDiscipline(data.discipline ?? "");
        setLieu(data.lieu ?? "");
        setDateDebut(toDateTimeLocal(data.date_debut));
        setDateFin(toDateTimeLocal(data.date_fin));
        setPrixBase(String(data.prix_base ?? "0.00"));
        setDescriptionCourte(data.description_courte ?? "");
        setDescriptionLongue(data.description_longue ?? "");
        setStatut(data.statut ?? "BROUILLON");
        setCurrentImageUrl(data.image_url ?? null);
      } catch (err: any) {
        if (isCanceledError(err) || controller.signal.aborted) return;

        const status = err?.response?.status;
        if (status === 401) setLoadError("Session expirée.");
        else if (status === 403) setLoadError("Accès refusé.");
        else if (status === 404) setLoadError("Événement introuvable.");
        else setLoadError("Erreur lors du chargement.");
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
    if (!lieu.trim()) return "Le lieu est obligatoire.";
    if (!dateDebut || !dateFin) return "Les dates sont obligatoires.";

    if (!isValidDate(dateDebut) || !isValidDate(dateFin)) {
      return "Format de date invalide.";
    }

    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);

    if (debut >= fin) {
      return "La date de fin doit être postérieure à la date de début.";
    }

    if (Number(prixBase) < 0) return "Le prix doit être positif.";

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const v = validate();
    if (v) {
      setFormError(v);
      return;
    }

    try {
      setSaving(true);
      setFormError(null);

      const formData = new FormData();
      formData.append("nom_evenement", nomEvenement.trim());
      formData.append("discipline", discipline.trim());
      formData.append("lieu", lieu.trim());
      formData.append("date_debut", dateDebut);
      formData.append("date_fin", dateFin);
      formData.append("prix_base", prixBase);
      formData.append("description_courte", descriptionCourte.trim());
      formData.append("description_longue", descriptionLongue.trim());
      formData.append("statut", statut);

      // image optionnelle
      if (image) {
        formData.append("image", image);
      }

      await api.patch(`/evenements/admin/${eventId}/`, formData);

      navigate("/admin/evenements");
    } catch (err: any) {
      const status = err?.response?.status;
      const apiMsg = extractApiError(err);

      if (status === 400) setFormError(apiMsg ?? "Données invalides (400). Vérifie dates/prix.");
      else if (status === 401) setFormError("Session expirée.");
      else if (status === 403) setFormError("Accès refusé.");
      else setFormError(apiMsg ?? "Erreur lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="admin-table-state">Chargement…</div>;
  }

  if (loadError) {
    return (
      <div className="admin-page">
        <div className="admin-alert">{loadError}</div>
        <Link to="/admin/evenements" className="admin-btn admin-btn--ghost">
          ← Retour
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-title">Modifier l’événement</div>
      <div className="admin-subtitle">L’événement reste visible jusqu’à sa date de fin.</div>

      <Link to="/admin/evenements" className="admin-btn admin-btn--ghost">
        ← Retour à la liste
      </Link>

      {formError && (
        <div className="admin-alert" style={{ marginTop: "1rem" }}>
          {formError}
        </div>
      )}

      <div className="admin-table-wrap" style={{ padding: "1rem" }}>
        <form onSubmit={handleSubmit} className="admin-form" style={{ maxWidth: 760 }}>
          <div className="admin-grid-2">
            <input
              className="admin-input"
              value={nomEvenement}
              onChange={(e) => setNomEvenement(e.target.value)}
              placeholder="Nom"
            />
            <input
              className="admin-input"
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
              placeholder="Discipline"
            />
          </div>

          <input
            className="admin-input"
            value={lieu}
            onChange={(e) => setLieu(e.target.value)}
            placeholder="Lieu"
          />

          <div className="admin-grid-2">
            <input
              type="datetime-local"
              className="admin-input"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
            />
            <input
              type="datetime-local"
              className="admin-input"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
            />
          </div>

          <input
            type="number"
            className="admin-input"
            step="0.01"
            min="0"
            value={prixBase}
            onChange={(e) => setPrixBase(e.target.value)}
            placeholder="Prix de base (€)"
          />

          <textarea
            className="admin-textarea"
            value={descriptionCourte}
            onChange={(e) => setDescriptionCourte(e.target.value)}
            placeholder="Description courte"
          />

          <textarea
            className="admin-textarea admin-textarea--lg"
            value={descriptionLongue}
            onChange={(e) => setDescriptionLongue(e.target.value)}
            placeholder="Description longue"
          />

          <div className="admin-grid-2">
            <div>
              <div className="admin-text-muted" style={{ marginBottom: 6 }}>
                Image actuelle
              </div>
              {currentImageUrl ? (
                <img
                  src={currentImageUrl}
                  alt="Image actuelle"
                  style={{ width: "100%", maxWidth: 240, borderRadius: 12, display: "block" }}
                />
              ) : (
                <div className="admin-text-muted">Aucune image</div>
              )}
            </div>

            <div>
              <div className="admin-text-muted" style={{ marginBottom: 6 }}>
                Remplacer l’image
              </div>
              <input
                type="file"
                accept="image/*"
                className="admin-file"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <select
            className="admin-select"
            value={statut}
            onChange={(e) => setStatut(e.target.value as EventStatus)}
          >
            <option value="BROUILLON">Brouillon</option>
            <option value="PUBLIE">Publié</option>
            <option value="ARCHIVE">Archivé</option>
          </select>

          <div className="admin-actions">
            <button className="admin-btn" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}