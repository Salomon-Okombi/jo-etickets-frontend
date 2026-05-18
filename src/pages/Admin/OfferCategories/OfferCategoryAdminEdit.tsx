import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useToast from "@/hooks/useToast";
import {
  getOfferCategoryAdmin,
  updateOfferCategoryAdmin,
  type OfferCategory,
  type OfferCategoryUpdatePayload,
} from "@/api/offerCategories.api";
import "@/styles/admin.css";

function extractApiError(err: any): string | null {
  const data = err?.response?.data;
  if (!data) return null;

  if (typeof data === "string") return data;
  if (Array.isArray(data)) return data.join(" ");

  if (typeof data === "object") {
    const nfe = (data as any).non_field_errors;
    if (Array.isArray(nfe) && nfe.length) return nfe.join(" ");

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

export default function OfferCategoryAdminEdit() {
  const { id } = useParams<{ id: string }>();
  const categoryId = Number(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Erreur bloquante (chargement)
  const [loadError, setLoadError] = useState<string | null>(null);
  // Erreur non bloquante (validation/submit)
  const [formError, setFormError] = useState<string | null>(null);

  const [initial, setInitial] = useState<OfferCategory | null>(null);

  const [code, setCode] = useState("");
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [casUsage, setCasUsage] = useState("");
  const [nbPersonnes, setNbPersonnes] = useState<number | "">(1);
  const [ordreAffichage, setOrdreAffichage] = useState<number | "">(0);
  const [active, setActive] = useState(true);
  const [autoApplyAllEvents, setAutoApplyAllEvents] = useState(true);

  const normalizedCode = useMemo(() => normalizeCode(code), [code]);

  useEffect(() => {
    if (!Number.isFinite(categoryId) || categoryId <= 0) {
      setLoadError("Identifiant de catégorie invalide.");
      setLoading(false);
      return;
    }

    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setLoadError(null);
        setFormError(null);

        const data = await getOfferCategoryAdmin(categoryId);
        if (!mounted) return;

        setInitial(data);

        setCode(data.code ?? "");
        setNom(data.nom ?? "");
        setDescription(data.description ?? "");
        setCasUsage(data.cas_usage ?? "");

        setNbPersonnes(
          typeof data.nb_personnes === "number" ? data.nb_personnes : Number(data.nb_personnes)
        );

        setOrdreAffichage(
          typeof data.ordre_affichage === "number"
            ? data.ordre_affichage
            : Number(data.ordre_affichage)
        );

        setActive(Boolean(data.active));
        setAutoApplyAllEvents(Boolean(data.auto_apply_all_events));
      } catch (err: any) {
        if (!mounted) return;

        const status = err?.response?.status;
        if (status === 401) setLoadError("Session expirée. Reconnecte-toi.");
        else if (status === 403) setLoadError("Accès refusé (403).");
        else if (status === 404) setLoadError("Catégorie introuvable.");
        else setLoadError(extractApiError(err) ?? "Erreur lors du chargement.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [categoryId]);

  function validate(): string | null {
    if (!normalizedCode) return "Le code est obligatoire.";
    if (!nom.trim()) return "Le nom est obligatoire.";

    const nb = typeof nbPersonnes === "number" ? nbPersonnes : Number(nbPersonnes);
    if (!Number.isFinite(nb) || nb <= 0) {
      return "Le multiplicateur (nb personnes) doit être un entier positif.";
    }

    const ordre = typeof ordreAffichage === "number" ? ordreAffichage : Number(ordreAffichage);
    if (!Number.isFinite(ordre) || ordre < 0) {
      return "L’ordre d’affichage doit être un nombre positif.";
    }

    return null;
  }

  function buildPayload(nextActive: boolean): OfferCategoryUpdatePayload {
    return {
      code: normalizedCode,
      nom: nom.trim(),
      description: description.trim() ? description.trim() : null,
      cas_usage: casUsage.trim() ? casUsage.trim() : null,
      nb_personnes: typeof nbPersonnes === "number" ? nbPersonnes : Number(nbPersonnes),
      ordre_affichage: typeof ordreAffichage === "number" ? ordreAffichage : Number(ordreAffichage),
      active: nextActive,
      auto_apply_all_events: autoApplyAllEvents,
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const v = validate();
    if (v) {
      setFormError(v);
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      await updateOfferCategoryAdmin(categoryId, buildPayload(active));
      showToast("Catégorie mise à jour", "success");
      navigate("/admin/offres/categories");
    } catch (err: any) {
      const status = err?.response?.status;
      const apiMsg = extractApiError(err);

      if (status === 400) setFormError(apiMsg ?? "Données invalides (400).");
      else if (status === 401) setFormError("Session expirée. Reconnecte-toi.");
      else if (status === 403) setFormError("Accès refusé (403).");
      else setFormError(apiMsg ?? "Erreur lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  }

  async function onToggleActive() {
    if (!initial) return;

    const next = !active;
    const label = next ? "activer" : "désactiver";

    const warning = initial.auto_apply_all_events
      ? `Confirmer : ${label} cette catégorie globale ?`
      : `Confirmer : ${label} cette catégorie ?`;

    const ok = window.confirm(warning);
    if (!ok) return;

    setToggling(true);
    setFormError(null);

    try {
      await updateOfferCategoryAdmin(categoryId, buildPayload(next));
      setActive(next);

      // Met à jour initial pour afficher le bon texte
      setInitial((prev) => (prev ? { ...prev, active: next } : prev));

      showToast(next ? "Catégorie activée" : "Catégorie désactivée", "success");
    } catch (err: any) {
      const status = err?.response?.status;
      const apiMsg = extractApiError(err);

      if (status === 400) setFormError(apiMsg ?? "Action impossible (400).");
      else if (status === 401) setFormError("Session expirée. Reconnecte-toi.");
      else if (status === 403) setFormError("Accès refusé (403).");
      else setFormError(apiMsg ?? "Action impossible.");
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return <div className="admin-table-state">Chargement…</div>;
  }

  if (loadError) {
    return (
      <div className="admin-page">
        <div className="admin-alert">{loadError}</div>
        <Link to="/admin/offres/categories" className="admin-btn admin-btn--ghost">
          ← Retour
        </Link>
      </div>
    );
  }

  const toggleLabel = active ? "Désactiver" : "Activer";
  const toggleHint = active
    ? "Rend la catégorie indisponible (elle ne sera plus visible côté public)."
    : "Rend la catégorie à nouveau disponible.";

  return (
    <div className="admin-page">
      <div
        style={{
          marginBottom: "1.2rem",
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div>
          <div className="admin-title">Modifier une catégorie d’offre</div>
          <div className="admin-subtitle">
            {initial ? `${initial.code} — ${initial.nom}` : "Catégorie"}
          </div>
          <div className="admin-text-muted" style={{ marginTop: "0.25rem" }}>
            Statut : <strong>{active ? "ACTIVE" : "INACTIVE"}</strong> — {toggleHint}
          </div>
        </div>

        <button
          className={`admin-btn ${active ? "admin-btn--danger" : ""}`}
          type="button"
          onClick={onToggleActive}
          disabled={toggling}
        >
          {toggling ? "Traitement…" : toggleLabel}
        </button>
      </div>

      {formError && (
        <div className="admin-alert" style={{ marginBottom: "1rem" }}>
          {formError}
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
                placeholder="Ex: Offre Duo"
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
                Si globale, la catégorie sera appliquée aux événements existants (selon logique admin backend).
              </div>
            </div>
          </div>

          <div className="admin-actions" style={{ justifyContent: "flex-end" }}>
            <Link to="/admin/offres/categories" className="admin-btn admin-btn--ghost">
              Annuler
            </Link>

            <button type="submit" className="admin-btn" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}