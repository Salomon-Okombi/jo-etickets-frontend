import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "@/api/axiosClient";
import "@/styles/admin.css";

type OfferStatus = "ACTIVE" | "INACTIVE" | "EPUISEE" | "EXPIREE";

type EventLite = {
  id: number;
  nom_evenement: string;
  date_debut: string;
  date_fin: string;
  statut: "BROUILLON" | "PUBLIE" | "ARCHIVE";
};

type OfferRow = {
  id: number;

  evenement: number;
  evenement_nom?: string | null;

  categorie: number;
  categorie_code?: string | null;
  categorie_nom?: string | null;

  nom_offre: string;
  description?: string | null;

  prix_calcule?: string;
  nb_personnes?: number;

  quota_billets_total: number;
  quota_billets_restant: number;

  packs_total?: number;
  packs_disponibles?: number;

  date_debut_vente: string;
  date_fin_vente: string;

  statut: OfferStatus;
  est_disponible?: boolean;
};

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

function isCanceledError(err: any) {
  return err?.code === "ERR_CANCELED" || err?.name === "CanceledError" || err?.name === "AbortError";
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

function badgeClassForStatut(statut: OfferStatus) {
  if (statut === "ACTIVE") return "admin-badge admin-badge--ok";
  if (statut === "INACTIVE") return "admin-badge admin-badge--muted";
  if (statut === "EPUISEE") return "admin-badge admin-badge--warn";
  return "admin-badge admin-badge--danger";
}

export default function EventOffersAdminList() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);

  const [eventInfo, setEventInfo] = useState<EventLite | null>(null);

  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (!Number.isFinite(eventId) || eventId <= 0) {
      setError("Identifiant d’événement invalide.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);

        // 1) Charger l'événement (pour titre/contexte)
        const evRes = await api.get<EventLite>(`/evenements/admin/${eventId}/`, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;
        setEventInfo(evRes.data);

        // 2) Charger les offres de l'événement
        //    a) tentative endpoint dédié /offres/event-offers/
        //    b) fallback sur /offres/?evenement=<id>
        let rows: OfferRow[] = [];

        try {
          const { data } = await api.get<Paginated<OfferRow> | OfferRow[]>(
            "/offres/event-offers/",
            { params: { evenement: eventId }, signal: controller.signal }
          );

          if (controller.signal.aborted) return;
          rows = Array.isArray(data) ? data : data.results ?? [];
        } catch (err: any) {
          if (isCanceledError(err) || controller.signal.aborted) return;

          const status = err?.response?.status;
          if (status !== 404) throw err;

          // fallback: endpoint standard
          const { data } = await api.get<Paginated<OfferRow> | OfferRow[]>(
            "/offres/",
            { params: { evenement: eventId, page_size: 200 }, signal: controller.signal }
          );

          if (controller.signal.aborted) return;
          rows = Array.isArray(data) ? data : data.results ?? [];
        }

        setOffers(rows);
      } catch (err: any) {
        if (isCanceledError(err) || controller.signal.aborted) return;

        const status = err?.response?.status;
        if (status === 401) setError("Session expirée. Reconnecte-toi.");
        else if (status === 403) setError("Accès refusé (403).");
        else if (status === 404) setError("Événement introuvable.");
        else setError("Chargement des offres de l’événement impossible.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [eventId]);

  const filtered = useMemo(() => {
    if (!search) return offers;
    const q = search.toLowerCase();
    return offers.filter((o) => {
      const name = (o.nom_offre ?? "").toLowerCase();
      const cat = (o.categorie_code ?? o.categorie_nom ?? "").toLowerCase();
      return name.includes(q) || cat.includes(q);
    });
  }, [offers, search]);

  const sorted = useMemo(() => {
    // tri par catégorie_code puis id (stable)
    return [...filtered].sort((a, b) => {
      const ac = (a.categorie_code ?? "").localeCompare(b.categorie_code ?? "");
      if (ac !== 0) return ac;
      return a.id - b.id;
    });
  }, [filtered]);

  return (
    <div className="admin-page">
      <div style={{ marginBottom: "1.2rem" }}>
        <div className="admin-title">Offres de l’événement</div>
        <div className="admin-subtitle">
          {eventInfo ? (
            <>
              <strong>#{eventInfo.id}</strong> — {eventInfo.nom_evenement} —{" "}
              {fmtDateTime(eventInfo.date_debut)} → {fmtDateTime(eventInfo.date_fin)}
            </>
          ) : (
            "Gestion des quotas par catégorie (SOLO/DUO/FAMILLE)."
          )}
        </div>

        <div style={{ marginTop: "0.8rem", display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <Link to="/admin/evenements" className="admin-btn admin-btn--ghost">
            ← Retour événements
          </Link>

          <Link
            to={`/admin/offres/nouvelle?evenement=${eventId}`}
            className="admin-btn"
          >
            + Ajouter une offre (spécifique)
          </Link>

          <Link
            to="/admin/offres/categories"
            className="admin-btn admin-btn--ghost"
          >
            Gérer les catégories
          </Link>
        </div>
      </div>

      {error && (
        <div className="admin-alert" role="alert" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <div className="admin-table-wrap" style={{ marginTop: "1rem" }}>
        <div className="admin-table-head">
          <div>
            <div className="admin-table-title">Liste des offres</div>
            <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginTop: "0.15rem" }}>
              Quotas en billets + packs disponibles + fenêtre de vente
            </div>
          </div>

          <div className="admin-table-tools">
            <input
              className="admin-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Recherche (nom, catégorie...)"
            />
          </div>
        </div>

        {loading ? (
          <div className="admin-table-state">Chargement…</div>
        ) : sorted.length === 0 ? (
          <div className="admin-table-state">Aucune offre pour cet événement.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Catégorie</th>
                  <th>Nom</th>
                  <th className="admin-td-right">Prix</th>
                  <th className="admin-td-center">Billets</th>
                  <th className="admin-td-center">Quota billets</th>
                  <th className="admin-td-center">Packs dispo</th>
                  <th>Vente</th>
                  <th className="admin-td-center">Statut</th>
                  <th className="admin-td-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {sorted.map((o) => {
                  const catLabel =
                    o.categorie_code
                      ? `${o.categorie_code}${o.categorie_nom ? ` — ${o.categorie_nom}` : ""}`
                      : `#${o.categorie}`;

                  const nb = o.nb_personnes ?? 1;
                  const packsDispo =
                    o.packs_disponibles !== undefined
                      ? o.packs_disponibles
                      : Math.floor(o.quota_billets_restant / Math.max(1, nb));

                  return (
                    <tr key={o.id}>
                      <td>{o.id}</td>
                      <td>{catLabel}</td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{o.nom_offre}</div>
                        {o.description ? (
                          <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginTop: "0.15rem" }}>
                            {o.description}
                          </div>
                        ) : null}
                      </td>

                      <td className="admin-td-right">{fmtMoney(o.prix_calcule)}</td>

                      <td className="admin-td-center">{nb}</td>

                      <td className="admin-td-center">
                        {o.quota_billets_restant.toLocaleString("fr-FR")} / {o.quota_billets_total.toLocaleString("fr-FR")}
                      </td>

                      <td className="admin-td-center">{packsDispo.toLocaleString("fr-FR")}</td>

                      <td>
                        <div className="admin-text-muted" style={{ fontSize: "0.85rem" }}>
                          {fmtDateTime(o.date_debut_vente)} → {fmtDateTime(o.date_fin_vente)}
                        </div>
                      </td>

                      <td className="admin-td-center">
                        <span className={badgeClassForStatut(o.statut)}>{o.statut}</span>
                      </td>

                      <td className="admin-td-right">
                        <Link
                          className="admin-btn admin-btn--sm"
                          to={`/admin/offres/${o.id}`}
                        >
                          Modifier
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}