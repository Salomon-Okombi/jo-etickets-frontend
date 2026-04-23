// src/pages/Admin/Offers/OfferAdminCreate.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOffer } from "@/api/offers.api";
import { listEvents, type Event } from "@/api/events.api";
import type { OfferCreatePayload, OfferStatus, OfferType } from "@/types/offers";
import "@/styles/admin.css";

function unwrapResults<T>(data: any): T[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

function toIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default function OfferAdminCreate() {
  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const [saving, setSaving] = useState(false);
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
      setError(null);
      try {
        const res = await listEvents({ page: 1, page_size: 200 } as any);
        setEvents(unwrapResults<Event>(res));
      } catch {
        setError("Impossible de charger les événements.");
      } finally {
        setLoadingEvents(false);
      }
    }
    loadEvents();
  }, []);

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
      const now = new Date();

      const startIso = toIso(date_debut_vente) ?? now.toISOString();
      const endIso = toIso(date_fin_vente) ?? addDays(now, 30).toISOString();

      const payload: OfferCreatePayload = {
        evenement: Number(evenement),
        nom_offre: nom_offre.trim(),
        description: description.trim() ? description.trim() : null,
        prix: Number(prix),
        nb_personnes,
        type_offre,
        stock_total: Number(stock_total),
        stock_disponible: Number(stock_disponible),
        date_debut_vente: startIso,
        date_fin_vente: endIso,
        statut: statut as OfferStatus,
      };

      await createOffer(payload);
      navigate("/admin/offres");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 400) setError("Données invalides (400).");
      else if (status === 401) setError("Session expirée. Reconnecte-toi.");
      else if (status === 403) setError("Accès refusé (403).");
      else setError("Erreur lors de la création.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page">
      <div style={{ marginBottom: "1.2rem" }}>
        <div className="admin-title">Créer une offre</div>
        <div className="admin-subtitle">Création d’un pack rattaché à un événement.</div>
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
            <select
              className="admin-select"
              value={statut}
              onChange={(e) => setStatut(e.target.value as OfferStatus)}
            >
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
              {saving ? "Création…" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}