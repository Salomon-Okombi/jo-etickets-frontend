import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getOffer, updateOffer, deleteOffer } from "@/api/offers.api";
import { listAdminEvents, type Event } from "@/api/events.api";
import { listOfferCategoriesAdmin, type OfferCategory } from "@/api/offerCategories.api";
import type { OfferUpdatePayload, OfferStatus } from "@/types/offers";
import "@/styles/admin.css";

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

// Type local aligné avec le serializer (quota billets)
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

export default function OfferAdminEdit() {
  const { id } = useParams<{ id: string }>();
  const offerId = Number(id);
  const navigate = useNavigate();

  const [initial, setInitial] = useState<OfferRead | null>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [cats, setCats] = useState<OfferCategory[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [evenement, setEvenement] = useState<number | "">("");
  const [categorie, setCategorie] = useState<number | "">("");

  const [nom_offre, setNom] = useState("");
  const [description, setDescription] = useState("");

  const [quota_total, setQuotaTotal] = useState<number | "">(0);
  const [quota_restant, setQuotaRestant] = useState<number | "">(0);

  const [date_debut_vente, setDebut] = useState("");
  const [date_fin_vente, setFin] = useState("");

  const [statut, setStatut] = useState<OfferStatus>("ACTIVE");

  const selectedCat = useMemo(
    () => cats.find((c) => c.id === categorie),
    [cats, categorie]
  );

  // Prévisualisation packs dispo (quota restant / nb_personnes)
  const packsDispoPreview = useMemo(() => {
    const nb = selectedCat?.nb_personnes ?? 1;
    const q = typeof quota_restant === "number" ? quota_restant : Number(quota_restant);
    if (!Number.isFinite(q) || q < 0) return null;
    return Math.floor(q / Math.max(1, nb));
  }, [quota_restant, selectedCat?.nb_personnes]);

  /* ===============================
     LOAD REFERENCES (events + categories)
  =============================== */
  useEffect(() => {
    const controller = new AbortController();

    async function loadRefs() {
      setLoadingRefs(true);
      setError(null);

      try {
        const [evRes, categories] = await Promise.all([
          listAdminEvents({ page: 1, page_size: 200 } as any),
          listOfferCategoriesAdmin(), // doit renvoyer OfferCategory[]
        ]);

        if (controller.signal.aborted) return;

        setEvents(evRes.results ?? []);
        setCats(categories);
      } catch (err: any) {
        if (isCanceledError(err) || controller.signal.aborted) return;
        setError("Impossible de charger les événements/catégories.");
      } finally {
        if (!controller.signal.aborted) setLoadingRefs(false);
      }
    }

    loadRefs();
    return () => controller.abort();
  }, []);

  /* ===============================
     LOAD OFFER
  =============================== */
  useEffect(() => {
    const controller = new AbortController();

    async function init() {
      if (!Number.isFinite(offerId) || offerId <= 0) {
        setError("Identifiant d’offre invalide.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const ofRes = await getOffer(offerId);

        if (controller.signal.aborted) return;

        const o = ofRes as unknown as OfferRead;
        setInitial(o);

        setEvenement(o.evenement);
        setCategorie(o.categorie);

        setNom(o.nom_offre);
        setDescription(o.description ?? "");

        setQuotaTotal(o.quota_billets_total);
        setQuotaRestant(o.quota_billets_restant);

        setDebut(toDatetimeLocal(o.date_debut_vente));
        setFin(toDatetimeLocal(o.date_fin_vente));

        setStatut((o.statut ?? "ACTIVE") as OfferStatus);
      } catch (err: any) {
        if (isCanceledError(err) || controller.signal.aborted) return;

        const status = err?.response?.status;
        if (status === 404) setError("Offre introuvable.");
        else if (status === 401) setError("Session expirée. Reconnecte-toi.");
        else if (status === 403) setError("Accès refusé (403).");
        else setError("Impossible de charger l’offre.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    init();
    return () => controller.abort();
  }, [offerId]);

  /* ===============================
     VALIDATION
  =============================== */
  const canSubmit = useMemo(() => {
    if (evenement === "" || categorie === "") return false;
    if (!nom_offre.trim()) return false;

    if (quota_total === "" || quota_restant === "") return false;
    if (Number(quota_total) < 0 || Number(quota_restant) < 0) return false;
    if (Number(quota_restant) > Number(quota_total)) return false;

    const startIso = toIsoFromLocal(date_debut_vente);
    const endIso = toIsoFromLocal(date_fin_vente);
    if (!startIso || !endIso) return false;
    if (new Date(startIso) >= new Date(endIso)) return false;

    return true;
  }, [evenement, categorie, nom_offre, quota_total, quota_restant, date_debut_vente, date_fin_vente]);

  /* ===============================
     SUBMIT
  =============================== */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!canSubmit) {
      setError("Vérifie les champs obligatoires (événement, catégorie, nom, quotas, dates).");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: OfferUpdatePayload = {
        evenement: Number(evenement),
        categorie: Number(categorie),
        nom_offre: nom_offre.trim(),
        description: description.trim() ? description.trim() : null,

        quota_billets_total: Number(quota_total),
        quota_billets_restant: Number(quota_restant),

        date_debut_vente: toIsoFromLocal(date_debut_vente) as string,
        date_fin_vente: toIsoFromLocal(date_fin_vente) as string,
        statut: statut as OfferStatus,
      };

      await updateOffer(offerId, payload);
      navigate("/admin/offres");
    } catch (err: any) {
      if (isCanceledError(err)) return;

      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status === 400) {
        const msg = data && typeof data === "object" ? JSON.stringify(data) : "";
        if (msg.toLowerCase().includes("unique") || msg.includes("uniq_evenement_categorie")) {
          setError("Une offre existe déjà pour cet événement et cette catégorie.");
        } else {
          setError("Données invalides (400). Vérifie quotas et dates de vente.");
        }
      } else if (status === 401) setError("Session expirée. Reconnecte-toi.");
      else if (status === 403) setError("Accès refusé (403).");
      else setError("Erreur lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  }

  /* ===============================
     DELETE
  =============================== */
  async function onDelete() {
    const ok = window.confirm("Supprimer définitivement cette offre ?");
    if (!ok) return;

    setDeleting(true);
    setError(null);

    try {
      await deleteOffer(offerId);
      navigate("/admin/offres");
    } catch (err: any) {
      if (isCanceledError(err)) return;

      const status = err?.response?.status;
      if (status === 401) setError("Session expirée. Reconnecte-toi.");
      else if (status === 403) setError("Accès refusé (403).");
      else setError("Suppression impossible.");
    } finally {
      setDeleting(false);
    }
  }

  /* ===============================
     RENDER
  =============================== */
  if (loading) return <div className="admin-table-state">Chargement…</div>;

  if (!initial) {
    return (
      <div className="admin-page">
        <div className="admin-alert">{error ?? "Offre introuvable."}</div>
        <button className="admin-btn admin-btn--ghost" onClick={() => navigate("/admin/offres")}>
          ← Retour
        </button>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div style={{ marginBottom: "1.2rem", display: "flex", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <div className="admin-title">Modifier l’offre</div>
          <div className="admin-subtitle">
            Offre #{initial.id} — {initial.nom_offre}
            {initial.prix_calcule ? ` — Prix calculé: ${initial.prix_calcule} €` : ""}
          </div>
        </div>

        <button className="admin-btn admin-btn--danger" onClick={onDelete} disabled={deleting}>
          {deleting ? "Suppression…" : "Supprimer"}
        </button>
      </div>

      {error && (
        <div className="admin-alert" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <div className="admin-table-wrap" style={{ padding: "1rem" }}>
        <form onSubmit={onSubmit} className="admin-form" style={{ display: "grid", gap: "1rem", maxWidth: 820 }}>
          <div className="admin-grid-2">
            <div>
              <div className="admin-text-muted">Événement *</div>
              <select
                className="admin-select"
                value={evenement}
                onChange={(e) => setEvenement(e.target.value ? Number(e.target.value) : "")}
                disabled={loadingRefs}
              >
                <option value="" disabled>
                  {loadingRefs ? "Chargement…" : "Sélectionner un événement"}
                </option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    #{ev.id} — {ev.nom_evenement}
                  </option>
                ))}
              </select>
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
            <input className="admin-input" value={nom_offre} onChange={(e) => setNom(e.target.value)} />
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
                value={quota_total}
                onChange={(e) => setQuotaTotal(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>

            <div>
              <div className="admin-text-muted">Quota billets restant *</div>
              <input
                type="number"
                min={0}
                className="admin-input"
                value={quota_restant}
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
                value={date_debut_vente}
                onChange={(e) => setDebut(e.target.value)}
              />
            </div>

            <div>
              <div className="admin-text-muted">Fin de vente *</div>
              <input
                type="datetime-local"
                className="admin-input"
                value={date_fin_vente}
                onChange={(e) => setFin(e.target.value)}
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
            <Link to="/admin/offres" className="admin-btn admin-btn--ghost">
              Annuler
            </Link>

            <button type="submit" className="admin-btn" disabled={!canSubmit || saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
``