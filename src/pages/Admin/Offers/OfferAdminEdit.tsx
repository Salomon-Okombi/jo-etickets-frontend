// src/pages/Admin/Offers/OfferAdminEdit.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getOffer, updateOffer, deleteOffer } from "@/api/offers.api";
import { listEvents, type Event } from "@/api/events.api";
import type { Offer, OfferStatus, OfferType, OfferUpdatePayload } from "@/types/offers";
import "@/styles/admin.css";

function unwrapResults<T>(data: any): T[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

function toIsoOrUndefined(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function isoToDatetimeLocal(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
}

function isCanceledError(err: any) {
  return err?.code === "ERR_CANCELED" || err?.name === "CanceledError";
}

export default function OfferAdminEdit() {
  const { id } = useParams<{ id: string }>();
  const offerId = Number(id);
  const navigate = useNavigate();

  const [initial, setInitial] = useState<Offer | null>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [evenement, setEvenement] = useState<number | "">("");
  const [nom_offre, setNom] = useState("");
  const [description, setDescription] = useState("");

  const [prix, setPrix] = useState<number | "">("");
  const [type_offre, setTypeOffre] = useState<OfferType>("SOLO");

  const [stock_total, setStockTotal] = useState<number | "">("");
  const [stock_disponible, setStockDisponible] = useState<number | "">("");

  const [date_debut_vente, setDebut] = useState("");
  const [date_fin_vente, setFin] = useState("");

  const [statut, setStatut] = useState<OfferStatus>("ACTIVE");

  const nb_personnes = useMemo(() => {
    if (type_offre === "DUO") return 2;
    if (type_offre === "FAMILIALE") return 4;
    return 1;
  }, [type_offre]);

  useEffect(() => {
    async function loadEvents() {
      setLoadingEvents(true);
      try {
        const res = await listEvents({ page: 1, page_size: 200 } as any);
        setEvents(unwrapResults<Event>(res));
      } catch (err: any) {
        if (isCanceledError(err)) return;
        setError("Impossible de charger les événements.");
      } finally {
        setLoadingEvents(false);
      }
    }
    loadEvents();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    async function init() {
      if (!Number.isFinite(offerId) || offerId <= 0) {
        if (!mounted) return;
        setError("Identifiant d’offre invalide.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const ofRes = await getOffer(offerId);

        if (!mounted || controller.signal.aborted) return;

        setInitial(ofRes);
        setEvenement(ofRes.evenement);
        setNom(ofRes.nom_offre);
        setDescription(ofRes.description ?? "");

        const priceNum = typeof ofRes.prix === "string" ? Number(ofRes.prix) : ofRes.prix;
        setPrix(Number.isFinite(priceNum) ? priceNum : "");

        setTypeOffre((ofRes.type_offre ?? "SOLO") as OfferType);

        setStockTotal(ofRes.stock_total);
        setStockDisponible(ofRes.stock_disponible);

        setDebut(isoToDatetimeLocal(ofRes.date_debut_vente ?? null));
        setFin(isoToDatetimeLocal(ofRes.date_fin_vente ?? null));

        setStatut((ofRes.statut ?? "ACTIVE") as OfferStatus);
      } catch (err: any) {
        if (isCanceledError(err) || controller.signal.aborted) return;
        if (!mounted) return;

        const status = err?.response?.status;
        if (status === 404) setError("Offre introuvable.");
        else if (status === 401) setError("Session expirée. Reconnecte-toi.");
        else if (status === 403) setError("Accès refusé (403).");
        else setError("Impossible de charger l’offre.");
      } finally {
        if (!mounted || controller.signal.aborted) return;
        setLoading(false);
      }
    }

    init();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [offerId]);

  const canSubmit =
    evenement !== "" &&
    nom_offre.trim().length > 0 &&
    prix !== "" &&
    stock_total !== "" &&
    stock_disponible !== "" &&
    Number(stock_total) >= 0 &&
    Number(stock_disponible) >= 0 &&
    Number(stock_disponible) <= Number(stock_total);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!canSubmit) {
      setError("Vérifie les champs : événement, nom, prix, stocks.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: OfferUpdatePayload = {
        evenement: Number(evenement),
        nom_offre: nom_offre.trim(),
        description: description.trim() ? description.trim() : null,
        prix: Number(prix),
        nb_personnes,
        type_offre,
        stock_total: Number(stock_total),
        stock_disponible: Number(stock_disponible),
        date_debut_vente: toIsoOrUndefined(date_debut_vente),
        date_fin_vente: toIsoOrUndefined(date_fin_vente),
        statut: statut as OfferStatus,
      };

      await updateOffer(offerId, payload as OfferUpdatePayload);
      navigate("/admin/offres");
    } catch (err: any) {
      if (isCanceledError(err)) return;

      const status = err?.response?.status;
      if (status === 400) setError("Données invalides (400).");
      else if (status === 401) setError("Session expirée. Reconnecte-toi.");
      else if (status === 403) setError("Accès refusé (403).");
      else setError("Erreur lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  }

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
        <form onSubmit={onSubmit} style={{ display: "grid", gap: "1rem", maxWidth: 820 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <div className="admin-text-muted">Événement *</div>
              <select
                className="admin-select"
                value={evenement}
                onChange={(e) => setEvenement(e.target.value ? Number(e.target.value) : "")}
                disabled={loadingEvents}
              >
                <option value="" disabled>
                  {loadingEvents ? "Chargement…" : "Sélectionner un événement"}
                </option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    #{ev.id} — {ev.nom_evenement}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="admin-text-muted">Type d’offre *</div>
              <select
                className="admin-select"
                value={type_offre}
                onChange={(e) => setTypeOffre(e.target.value as OfferType)}
              >
                <option value="SOLO">SOLO (1 personne)</option>
                <option value="DUO">DUO (2 personnes)</option>
                <option value="FAMILIALE">FAMILIALE (4 personnes)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="admin-text-muted">Nom de l’offre *</div>
            <input className="admin-input" value={nom_offre} onChange={(e) => setNom(e.target.value)} />
          </div>

          <div>
            <div className="admin-text-muted">Description</div>
            <textarea
              className="admin-input"
              style={{ borderRadius: 16, minHeight: 110 }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <div className="admin-text-muted">Prix (€) *</div>
              <input
                type="number"
                min={0}
                step="0.01"
                className="admin-input"
                value={prix}
                onChange={(e) => setPrix(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>

            <div>
              <div className="admin-text-muted">Nombre de personnes</div>
              <input className="admin-input" value={nb_personnes} disabled />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <div className="admin-text-muted">Stock total *</div>
              <input
                type="number"
                min={0}
                className="admin-input"
                value={stock_total}
                onChange={(e) => setStockTotal(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>

            <div>
              <div className="admin-text-muted">Stock disponible *</div>
              <input
                type="number"
                min={0}
                className="admin-input"
                value={stock_disponible}
                onChange={(e) => setStockDisponible(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <div className="admin-text-muted">Début de vente</div>
              <input
                type="datetime-local"
                className="admin-input"
                value={date_debut_vente}
                onChange={(e) => setDebut(e.target.value)}
              />
            </div>

            <div>
              <div className="admin-text-muted">Fin de vente</div>
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

          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => navigate(-1)}>
              Annuler
            </button>

            <button type="submit" className="admin-btn" disabled={!canSubmit || saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}