import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "@/api/axiosClient";
import { listOfferCategoriesAdmin, type OfferCategory } from "@/api/offerCategories.api";
import type { OfferStatus } from "@/types/offers";
import "@/styles/admin.css";

type AdminEvent = {
  id: number;
  nom_evenement: string;
  date_debut: string;
  date_fin: string;
  statut: "BROUILLON" | "PUBLIE" | "ARCHIVE";
  prix_base?: string | number;
};

function isCanceledError(err: any) {
  return err?.code === "ERR_CANCELED" || err?.name === "CanceledError" || err?.name === "AbortError";
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

function toIsoFromLocal(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmtDateTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR");
}

export default function EventOfferAdminCreate() {
  const navigate = useNavigate();

  // support : route param /admin/evenements/:id/offres/nouvelle
  const { id } = useParams<{ id: string }>();

  // support : query param /admin/offres/nouvelle?evenement=12
  const [searchParams] = useSearchParams();
  const eventIdFromQuery = Number(searchParams.get("evenement"));

  const eventId = Number.isFinite(Number(id)) && Number(id) > 0 ? Number(id) : eventIdFromQuery;

  const [eventInfo, setEventInfo] = useState<AdminEvent | null>(null);
  const [cats, setCats] = useState<OfferCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categorie, setCategorie] = useState<number | "">("");

  const [nomOffre, setNomOffre] = useState("");
  const [description, setDescription] = useState("");

  const [quotaTotal, setQuotaTotal] = useState<number | "">(100);
  const [quotaRestant, setQuotaRestant] = useState<number | "">(100);

  const now = useMemo(() => new Date(), []);
  const [dateDebutVente, setDateDebutVente] = useState(() => toLocalInputValue(now));
  const [dateFinVente, setDateFinVente] = useState(() => toLocalInputValue(addDays(now, 30)));

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

  // Charger event + catégories
  useEffect(() => {
    if (!Number.isFinite(eventId) || eventId <= 0) {
      setError("Identifiant d’événement manquant ou invalide.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [evRes, categories] = await Promise.all([
          api.get<AdminEvent>(`/evenements/admin/${eventId}/`, { signal: controller.signal }),
          listOfferCategoriesAdmin(),
        ]);

        if (controller.signal.aborted) return;

        setEventInfo(evRes.data);
        setCats(categories);
      } catch (err: any) {
        if (isCanceledError(err) || controller.signal.aborted) return;

        const status = err?.response?.status;
        if (status === 401) setError("Session expirée. Reconnecte-toi.");
        else if (status === 403) setError("Accès refusé (403).");
        else if (status === 404) setError("Événement introuvable.");
        else setError("Impossible de charger l’événement ou les catégories.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [eventId]);

  // Nom par défaut (si vide)
  useEffect(() => {
    if (nomOffre.trim()) return;
    if (!eventInfo || !selectedCat) return;
    setNomOffre(`${selectedCat.code} - ${eventInfo.nom_evenement}`);
  }, [eventInfo, selectedCat, nomOffre]);

  function validate(): string | null {
    if (!Number.isFinite(eventId) || eventId <= 0) return "Événement invalide.";
    if (categorie === "") return "La catégorie est obligatoire.";
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
      setError(v);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        evenement: eventId,
        categorie: Number(categorie),
        nom_offre: nomOffre.trim(),
        description: description.trim() ? description.trim() : null,

        quota_billets_total: Number(quotaTotal),
        quota_billets_restant: Number(quotaRestant),

        date_debut_vente: toIsoFromLocal(dateDebutVente) as string,
        date_fin_vente: toIsoFromLocal(dateFinVente) as string,
        statut,
      };

      // 1) tentative endpoint dédié
      try {
        await api.post("/offres/event-offers/", payload);
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404) {
          // 2) fallback endpoint standard offres
          await api.post("/offres/", payload);
        } else {
          throw err;
        }
      }

      navigate(eventInfo ? `/admin/evenements/${eventId}/offres` : "/admin/offres");
    } catch (err: any) {
      const status = err?.response?.status;
      const apiMsg = extractApiError(err);

      if (status === 400) {
        const msg = apiMsg ?? "Données invalides (400).";
        // cas fréquent : unique (evenement,categorie)
        if ((apiMsg ?? "").toLowerCase().includes("unique") || (apiMsg ?? "").includes("uniq_evenement_categorie")) {
          setError("Cette offre existe déjà pour cet événement et cette catégorie.");
        } else {
          setError(msg);
        }
      } else if (status === 401) setError("Session expirée. Reconnecte-toi.");
      else if (status === 403) setError("Accès refusé (403).");
      else setError(apiMsg ?? "Erreur lors de la création.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page">
      <div style={{ marginBottom: "1.2rem" }}>
        <div className="admin-title">Ajouter une offre à un événement</div>
        <div className="admin-subtitle">
          {eventInfo ? (
            <>
              <strong>#{eventInfo.id}</strong> — {eventInfo.nom_evenement} —{" "}
              {fmtDateTime(eventInfo.date_debut)} → {fmtDateTime(eventInfo.date_fin)}
            </>
          ) : (
            "Création d’une offre spécifique à un événement."
          )}
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
              <div className="admin-text-muted">Événement</div>
              <input className="admin-input" value={eventInfo ? `${eventInfo.id} — ${eventInfo.nom_evenement}` : String(eventId)} disabled />
            </div>

            <div>
              <div className="admin-text-muted">Catégorie *</div>
              <select
                className="admin-select"
                value={categorie}
                onChange={(e) => setCategorie(e.target.value ? Number(e.target.value) : "")}
                disabled={loading}
              >
                <option value="" disabled>
                  {loading ? "Chargement…" : "Sélectionner une catégorie"}
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
              to={eventInfo ? `/admin/evenements/${eventId}/offres` : "/admin/offres"}
              className="admin-btn admin-btn--ghost"
            >
              Annuler
            </Link>

            <button type="submit" className="admin-btn" disabled={saving || loading}>
              {saving ? "Création…" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}