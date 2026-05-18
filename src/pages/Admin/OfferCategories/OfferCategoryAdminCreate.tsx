import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createOfferCategoryAdmin,
  type OfferCategoryCreatePayload,
} from "@/api/offerCategories.api";
import "@/styles/admin.css";

function extractApiError(err: any): string | null {
  const data = err?.response?.data;
  if (!data) return null;

  if (typeof data === "string") return data;
  if (Array.isArray(data)) return data.join(" ");

  if (typeof data === "object") {
    const nfe = (data as any).non_field_errors;
    if (Array.isArray(nfe) && nfe.length) {
      return nfe.join(" ");
    }

    for (const key of Object.keys(data)) {
      const val = (data as any)[key];
      if (Array.isArray(val) && val.length) return `${key} : ${val.join(" ")}`;
      if (typeof val === "string") return `${key} : ${val}`;
    }
  }

  return null;
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "_");
}

export default function OfferCategoryAdminCreate() {
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [casUsage, setCasUsage] = useState("");
  const [nbPersonnes, setNbPersonnes] = useState<number | "">(1);
  const [ordreAffichage, setOrdreAffichage] = useState<number | "">(0);
  const [active, setActive] = useState(true);
  const [autoApplyAllEvents, setAutoApplyAllEvents] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedCode = useMemo(() => normalizeCode(code), [code]);

  function validate(): string | null {
    if (!normalizedCode) return "Le code est obligatoire.";
    if (!nom.trim()) return "Le nom est obligatoire.";

    const nb = typeof nbPersonnes === "number" ? nbPersonnes : Number(nbPersonnes);
    if (!Number.isFinite(nb) || nb <= 0) {
      return "Le multiplicateur (nb personnes) doit être un entier positif.";
    }

    const ordre =
      typeof ordreAffichage === "number" ? ordreAffichage : Number(ordreAffichage);
    if (!Number.isFinite(ordre) || ordre < 0) {
      return "L’ordre d’affichage doit être un nombre positif.";
    }

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
      const payload: OfferCategoryCreatePayload = {
        code: normalizedCode,
        nom: nom.trim(),
        description: description.trim() ? description.trim() : null,
        nb_personnes: typeof nbPersonnes === "number" ? nbPersonnes : Number(nbPersonnes),
        cas_usage: casUsage.trim() ? casUsage.trim() : null,
        ordre_affichage:
          typeof ordreAffichage === "number" ? ordreAffichage : Number(ordreAffichage),
        active,
        auto_apply_all_events: autoApplyAllEvents,
      };

      await createOfferCategoryAdmin(payload);
      navigate("/admin/offres/categories");
    } catch (err: any) {
      const status = err?.response?.status;
      const apiMsg = extractApiError(err);

      if (status === 400) setError(apiMsg ?? "Données invalides (400). Vérifie les champs.");
      else if (status === 401) setError("Session expirée. Reconnecte-toi.");
      else if (status === 403) setError("Accès refusé (403).");
      else setError(apiMsg ?? "Erreur lors de la création.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page">
      <div style={{ marginBottom: "1.2rem" }}>
        <div className="admin-title">Créer une catégorie d’offre</div>
        <div className="admin-subtitle">
          Une catégorie définit le pack (SOLO/DUO/FAMILLE) via un multiplicateur (nb personnes).
        </div>
      </div>

      {error && (
        <div className="admin-alert" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <div className="admin-table-wrap" style={{ padding: "1rem" }}>
        <form onSubmit={onSubmit} className="admin-form" style={{ maxWidth: 820 }}>
          <div className="admin-grid-2">
            <div>
              <div className="admin-text-muted">Code *</div>
              <input
                className="admin-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="SOLO / DUO / FAMILLE"
              />
              <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginTop: "0.35rem" }}>
                Code normalisé : <strong>{normalizedCode || "—"}</strong>
              </div>
            </div>

            <div>
              <div className="admin-text-muted">Nom *</div>
              <input
                className="admin-input"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Offre Solo"
              />
            </div>
          </div>

          <div className="admin-grid-2">
            <div>
              <div className="admin-text-muted">Multiplicateur (nb personnes) *</div>
              <input
                type="number"
                min={1}
                step={1}
                className="admin-input"
                value={nbPersonnes}
                onChange={(e) => setNbPersonnes(e.target.value === "" ? "" : Number(e.target.value))}
              />
              <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginTop: "0.35rem" }}>
                Le prix sera : <strong>prix_base événement × nb_personnes</strong>
              </div>
            </div>

            <div>
              <div className="admin-text-muted">Ordre d’affichage</div>
              <input
                type="number"
                min={0}
                step={1}
                className="admin-input"
                value={ordreAffichage}
                onChange={(e) => setOrdreAffichage(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <div className="admin-text-muted">Description</div>
            <textarea
              className="admin-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Texte affiché côté public (optionnel)"
            />
          </div>

          <div>
            <div className="admin-text-muted">Cas d’usage</div>
            <textarea
              className="admin-textarea"
              value={casUsage}
              onChange={(e) => setCasUsage(e.target.value)}
              placeholder="Notes internes / cas d’usage (optionnel)"
            />
          </div>

          <div className="admin-grid-2">
            <div>
              <div className="admin-text-muted">Active</div>
              <select
                className="admin-select"
                value={active ? "1" : "0"}
                onChange={(e) => setActive(e.target.value === "1")}
              >
                <option value="1">Oui</option>
                <option value="0">Non</option>
              </select>
            </div>

            <div>
              <div className="admin-text-muted">Appliquer à tous les événements</div>
              <select
                className="admin-select"
                value={autoApplyAllEvents ? "1" : "0"}
                onChange={(e) => setAutoApplyAllEvents(e.target.value === "1")}
              >
                <option value="1">Oui (globale)</option>
                <option value="0">Non (spécifique)</option>
              </select>
              <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginTop: "0.35rem" }}>
                Si globale, la catégorie est ajoutée automatiquement aux événements existants.
              </div>
            </div>
          </div>

          <div className="admin-actions" style={{ justifyContent: "flex-end" }}>
            <Link to="/admin/offres/categories" className="admin-btn admin-btn--ghost">
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
``