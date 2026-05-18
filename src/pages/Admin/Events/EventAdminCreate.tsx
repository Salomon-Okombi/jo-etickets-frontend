// src/pages/Admin/Events/EventAdminCreate.tsx
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/api/axiosClient";
import "@/styles/admin.css";

type EventStatus = "BROUILLON" | "PUBLIE" | "ARCHIVE";

function isValidDate(value: string) {
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

function extractApiError(err: any): string | null {
  // DRF renvoie souvent: {field: ["msg"]} ou {non_field_errors: ["msg"]}
  const data = err?.response?.data;
  if (!data) return null;

  if (typeof data === "string") return data;

  if (Array.isArray(data)) return data.join(" ");

  if (typeof data === "object") {
    if (Array.isArray(data.non_field_errors) && data.non_field_errors.length) {
      return data.non_field_errors.join(" ");
    }
    // retourne le premier message trouvé
    for (const key of Object.keys(data)) {
      const val = (data as any)[key];
      if (Array.isArray(val) && val.length) return `${key} : ${val.join(" ")}`;
      if (typeof val === "string") return `${key} : ${val}`;
    }
  }
  return null;
}

export default function EventAdminCreate() {
  const navigate = useNavigate();

  const [nomEvenement, setNomEvenement] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [lieu, setLieu] = useState("");

  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const [prixBase, setPrixBase] = useState("0.00");
  const [descriptionCourte, setDescriptionCourte] = useState("");
  const [descriptionLongue, setDescriptionLongue] = useState("");
  const [statut, setStatut] = useState<EventStatus>("BROUILLON");
  const [image, setImage] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Option : petite tolérance (ex: 30 secondes) pour éviter le "juste avant maintenant"
  const nowWithTolerance = useMemo(() => {
    const now = new Date();
    now.setSeconds(now.getSeconds() - 30);
    return now;
  }, []);

  function validate(): string | null {
    if (!nomEvenement.trim()) return "Le nom est obligatoire.";
    if (!discipline.trim()) return "La discipline est obligatoire.";
    if (!lieu.trim()) return "Le lieu est obligatoire.";

    if (!dateDebut) return "La date de début est obligatoire.";
    if (!dateFin) return "La date de fin est obligatoire.";

    if (!isValidDate(dateDebut) || !isValidDate(dateFin)) {
      return "Format de date invalide.";
    }

    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);

    if (debut >= fin) {
      return "La date de fin doit être postérieure à la date de début.";
    }

    // Cohérence avec la règle backend (création dans le futur)
    // (on applique une tolérance légère pour éviter une erreur à 1 seconde près)
    if (debut < nowWithTolerance) {
      return "La date de début doit être égale ou postérieure à maintenant.";
    }

    if (Number(prixBase) < 0) return "Le prix de base doit être positif.";

    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    try {
      setSaving(true);
      setError(null);

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

      if (image) formData.append("image", image);

      await api.post("/evenements/admin/", formData);
      navigate("/admin/evenements");
    } catch (err: any) {
      const apiMsg = extractApiError(err);
      setError(apiMsg ?? "Erreur lors de la création de l’événement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-title">Créer un événement</div>
      <div className="admin-subtitle">
        Définissez la période de validité. L’événement sera visible et réservable uniquement dans cet intervalle.
      </div>

      {error && <div className="admin-alert">{error}</div>}

      <div className="admin-table-wrap" style={{ padding: "1rem" }}>
        <form onSubmit={onSubmit} className="admin-form">
          <div className="admin-grid-2">
            <input
              className="admin-input"
              placeholder="Nom de l’événement *"
              value={nomEvenement}
              onChange={(e) => setNomEvenement(e.target.value)}
            />
            <input
              className="admin-input"
              placeholder="Discipline *"
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
            />
          </div>

          <input
            className="admin-input"
            placeholder="Lieu *"
            value={lieu}
            onChange={(e) => setLieu(e.target.value)}
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
            step="0.01"
            min="0"
            className="admin-input"
            placeholder="Prix de base (€)"
            value={prixBase}
            onChange={(e) => setPrixBase(e.target.value)}
          />

          <textarea
            className="admin-textarea"
            placeholder="Description courte"
            value={descriptionCourte}
            onChange={(e) => setDescriptionCourte(e.target.value)}
          />

          <textarea
            className="admin-textarea admin-textarea--lg"
            placeholder="Description longue"
            value={descriptionLongue}
            onChange={(e) => setDescriptionLongue(e.target.value)}
          />

          <div className="admin-grid-2">
            <input
              type="file"
              accept="image/*"
              className="admin-file"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
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
          </div>

          <div className="admin-actions">
            <Link to="/admin/evenements" className="admin-btn admin-btn--ghost">
              Annuler
            </Link>
            <button className="admin-btn" disabled={saving}>
              {saving ? "Création…" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
