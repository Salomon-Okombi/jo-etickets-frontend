import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "@/api/axiosClient";
import { getOffer, updateOffer, deleteOffer } from "@/api/offers.api";
import { listOfferCategoriesAdmin, type OfferCategory } from "@/api/offerCategories.api";
import type { OfferStatus, OfferUpdatePayload } from "@/types/offers";
import "@/styles/admin.css";

type AdminEventLite = {
  id: number;
  nom_evenement: string;
  date_debut: string;
  date_fin: string;
  statut: "BROUILLON" | "PUBLIE" | "ARCHIVE";
};

type OfferRead = {
  id: number;

  evenement: number;
  evenement_nom?: string | null;

  categorie: number;
  categorie_code?: string | null;
  categorie_nom?: string | null;

  nom_offre: string;
  description?: string | null;

  prix_calcule?: string;

  quota_billets_total: number;
  quota_billets_restant: number;

  packs_total?: number;
  packs_disponibles?: number;

  date_debut_vente: string;
  date_fin_vente: string;

  statut: OfferStatus;
  est_disponible?: boolean;
};

function isCanceledError(err: any) {
  return err?.code === "ERR_CANCELED" || err?.name === "CanceledError" || err?.name === "AbortError";
}

function toDatetimeLocal(value?: string | null): string {
  if (!value) return "";
  // datetime-local attend "YYYY-MM-DDTHH:mm"
  return value.slice(0, 16);
}

function toIsoFromLocal(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function fmtDateTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR");
}

function fmtMoney(v?: string | number | null) {
  if (v === undefined || v === null) return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

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

export default function EventOfferAdminEdit() {
  const { id } = useParams<{ id: string }>();
  const offerId = Number(id);
  const navigate = useNavigate();

  const [initial, setInitial] = useState<OfferRead | null>(null);
  const [eventInfo, setEventInfo] = useState<AdminEventLite | null>(null);

  const [cats, setCats] = useState<OfferCategory[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [evenement, setEvenement] = useState<number | "">("");
  const [categorie, setCategorie] = useState<number | "">("");

  const [nomOffre, setNomOffre] = useState("");
  const [description, setDescription] = useState("");

  const [quotaTotal, setQuotaTotal] = useState<number | "">(0);
  const [quotaRestant, setQuotaRestant] = useState<number | "">(0);

  const [dateDebutVente, setDateDebutVente] = useState("");
  const [dateFinVente, setDateFinVente] = useState("");

  const [statut, setStatut] = useState<OfferStatus>("ACTIVE");

  const selectedCat = useMemo(
    () => cats.find((c) => c.id === categorie),
    [cats, categorie]
  );

  const packsDispoPreview = useMemo(() => {
    const nb = selectedCat?.nb_personnes ?? 1;
    const q = typeof quotaRestant === "number" ? quotaRestant : Number(quotaRestant);
    if (!Number.isFinite(q) || q < 0) return null;
    return Math.floor(q / Math.max(1, nb));
  }, [quotaRestant, selectedCat?.nb_personnes]);

  // Load refs: categories
  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      setLoadingRefs(true);
      try {
        const categories = await listOfferCategoriesAdmin(); // doit renvoyer OfferCategory[]
        if (controller.signal.aborted) return;
        setCats(categories);
      } catch (err: any) {
        if (isCanceledError(err) || controller.signal.aborted) return;
        // non bloquant, mais on garde un message
        setCats([]);
      } finally {
        if (!controller.signal.aborted) setLoadingRefs(false);
      }
    }

    loadCategories();
    return () => controller.abort();
  }, []);

  // Load offer + event info
  useEffect(() => {
    if (!Number.isFinite(offerId) || offerId <= 0) {
      setLoadError("Identifiant d’offre invalide.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadAll() {
      try {
        setLoading(true);
        setLoadError(null);
        setFormError(null);

        const offer = (await getOffer(offerId)) as unknown as OfferRead;
        if (controller.signal.aborted) return;

        setInitial(offer);

        setEvenement(offer.evenement);
        setCategorie(offer.categorie);

        setNomOffre(offer.nom_offre);
        setDescription(offer.description ?? "");

        setQuotaTotal(offer.quota_billets_total);
        setQuotaRestant(offer.quota_billets_restant);

        setDateDebutVente(toDatetimeLocal(offer.date_debut_vente));
        setDateFinVente(toDatetimeLocal(offer.date_fin_vente));

        setStatut((offer.statut ?? "ACTIVE") as OfferStatus);

        // Charger eventInfo (pour contexte UI)
        try {
          const evRes = await api.get<AdminEventLite>(`/evenements/admin/${offer.evenement}/`, {
            signal: controller.signal,
          });
          if (controller.signal.aborted) return;
          setEventInfo(evRes.data);
        } catch (e) {
          // non bloquant : si l'endpoint admin event est inaccessible, on garde null
          setEventInfo(null);
        }
      } catch (err: any) {
        if (isCanceledError(err) || controller.signal.aborted) return;

        const status = err?.response?.status;
        if (status === 401) setLoadError("Session expirée. Reconnecte-toi.");
        else if (status === 403) setLoadError("Accès refusé (403).");
        else if (status === 404) setLoadError("Offre introuvable.");
        else setLoadError(extractApiError(err) ?? "Erreur lors du chargement.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadAll();
    return () => controller.abort();
  }, [offerId]);

  function validate(): string | null {
    if (evenement === "" || !Number.isFinite(Number(evenement)) || Number(evenement) <= 0) {
      return "Événement invalide.";
    }
    if (categorie === "" || !Number.isFinite(Number(categorie)) || Number(categorie) <= 0) {
      return "La catégorie est obligatoire.";
    }
    if (!nomOffre.trim()) return "Le nom est obligatoire.";

    if (quotaTotal === "" || quotaRestant === "") return "Les quotas sont obligatoires.";
    if (Number(quotaTotal) < 0 || Number(quotaRestant) < 0) return "Les quotas doivent être positifs.";
    if (Number(quotaRestant) > Number(quotaTotal)) return "Le quota restant ne peut pas dépasser le quota total.";

    const startIso = toIsoFromLocal(dateDebutVente);
    const endIso = toIsoFromLocal(dateFinVente);
    if (!startIso || !endIso) return "Dates de vente invalides.";
    if (new Date(startIso) >= new Date(endIso)) return "La fin de vente doit être postérieure au début.";

    return null;
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
      const payload: OfferUpdatePayload = {
        evenement: Number(evenement),
        categorie: Number(categorie),
        nom_offre: nomOffre.trim(),
        description: description.trim() ? description.trim() : null,

        quota_billets_total: Number(quotaTotal),
        quota_billets_restant: Number(quotaRestant),

        date_debut_vente: toIsoFromLocal(dateDebutVente) as string,
        date_fin_vente: toIsoFromLocal(dateFinVente) as string,
        statut,
      };

      await updateOffer(offerId, payload);

      // Retour logique : si on vient d’une page "event offers", on y retourne
      if (eventInfo) navigate(`/admin/evenements/${eventInfo.id}/offres`);
      else navigate("/admin/offres");
    } catch (err: any) {
      if (isCanceledError(err)) return;

      const status = err?.response?.status;
      const apiMsg = extractApiError(err);

      if (status === 400) {
        const msg = apiMsg ?? "Données invalides (400).";
        if (msg.toLowerCase().includes("unique") || msg.includes("uniq_evenement_categorie")) {
          setFormError("Une offre existe déjà pour cet événement et cette catégorie.");
        } else {
          setFormError(msg);
        }
      } else if (status === 401) setFormError("Session expirée. Reconnecte-toi.");
      else if (status === 403) setFormError("Accès refusé (403).");
      else setFormError(apiMsg ?? "Erreur lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    const ok = window.confirm("Supprimer cette offre ? Cette action est irréversible.");
    if (!ok) return;

    setDeleting(true);
    setFormError(null);

    try {
      await deleteOffer(offerId);

      if (eventInfo) navigate(`/admin/evenements/${eventInfo.id}/offres`);
      else navigate("/admin/offres");
    } catch (err: any) {
      if (isCanceledError(err)) return;
      const status = err?.response?.status;
      const apiMsg = extractApiError(err);

      if (status === 401) setFormError("Session expirée. Reconnecte-toi.");
      else if (status === 403) setFormError("Accès refusé (403).");
      else setFormError(apiMsg ?? "Suppression impossible.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <div className="admin-table-state">Chargement…</div>;

  if (loadError) {
    return (
      <div className="admin-page">
        <div className="admin-alert">{loadError}</div>
        <Link to="/admin/offres" className="admin-btn admin-btn--ghost">
          ← Retour
        </Link>
      </div>
    );
  }

  const headerSubtitle = eventInfo
    ? `#${eventInfo.id} — ${eventInfo.nom_evenement} — ${fmtDateTime(eventInfo.date_debut)} → ${fmtDateTime(
        eventInfo.date_fin
      )}`
    : initial
      ? `Offre #${initial.id} — ${initial.nom_offre}`
      : "Offre";

  return (
    <div className="admin-page">
      <div style={{ marginBottom: "1.2rem", display: "flex", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <div className="admin-title">Modifier une offre d’événement</div>
          <div className="admin-subtitle">
            {headerSubtitle}
            {initial?.prix_calcule ? ` — Prix calculé: ${fmtMoney(initial.prix_calcule)}` : ""}
          </div>
        </div>

        <button className="admin-btn admin-btn--danger" onClick={onDelete} disabled={deleting}>
          {deleting ? "Suppression…" : "Supprimer"}
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
              <div className="admin-text-muted">Événement</div>
              <input
                className="admin-input"
                value={eventInfo ? `${eventInfo.id} — ${eventInfo.nom_evenement}` : String(evenement)}
                disabled
              />
            </div>

            <div>
              <div className="admin-text-muted">Catégorie *</div>
              <select
                className="admin-select"
                value={categorie}
                onChange={(e) => setCategorie(e.target.value ? Number(e.target.value) : "")}
                disabled={loadingRefs}
              >
                <option value="" disabled>
                  {loadingRefs ? "Chargement…" : "Sélectionner une catégorie"}
                </option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.nom} ({c.nb_personnes})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="admin-text-muted">Nom de l’offre *</div>
            <input className="admin-input" value={nomOffre} onChange={(e) => setNomOffre(e.target.value)} />
          </div>

          <div>
            <div className="admin-text-muted">Description</div>
            <textarea className="admin-textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="admin-grid-2">
            <div>
              <div className="admin-text-muted">Quota billets total *</div>
              <input
                type="number"
                min={0}
                className="admin-input"
                value={quotaTotal}
                onChange={(e) => setQuotaTotal(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <div>
              <div className="admin-text-muted">Quota billets restant *</div>
              <input
                type="number"
                min={0}
                className="admin-input"
                value={quotaRestant}
                onChange={(e) => setQuotaRestant(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          </div>

          {selectedCat ? (
            <div className="admin-text-muted" style={{ marginTop: "-0.2rem" }}>
              Estimation packs disponibles: {packsDispoPreview === null ? "—" : packsDispoPreview} (quota restant /{" "}
              {selectedCat.nb_personnes})
            </div>
          ) : null}

          <div className="admin-grid-2">
            <div>
              <div className="admin-text-muted">Début de vente *</div>
              <input
                type="datetime-local"
                className="admin-input"
                value={dateDebutVente}
                onChange={(e) => setDateDebutVente(e.target.value)}
              />
            </div>
            <div>
              <div className="admin-text-muted">Fin de vente *</div>
              <input
                type="datetime-local"
                className="admin-input"
                value={dateFinVente}
                onChange={(e) => setDateFinVente(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="admin-text-muted">Statut</div>
            <select className="admin-select" value={statut} onChange={(e) => setStatut(e.target.value as OfferStatus)}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="EPUISEE">EPUISEE</option>
              <option value="EXPIREE">EXPIREE</option>
            </select>
          </div>

          <div className="admin-actions" style={{ justifyContent: "flex-end" }}>
            <Link
              to={eventInfo ? `/admin/evenements/${eventInfo.id}/offres` : "/admin/offres"}
              className="admin-btn admin-btn--ghost"
            >
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