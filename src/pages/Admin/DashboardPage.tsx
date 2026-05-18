// src/pages/DashboardPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/api/axiosClient";
import useToast from "@/hooks/useToast";
import "@/styles/admin.css";

/* =========================================================================
   Dashboard Admin (billetterie)
   - KPI : synthèse rapide
   - Table : tickets/réservations (priorité visuelle)
   - Accès rapides : STATISTIQUES / UTILISATEURS / OFFRES / ÉVÉNÉNEMENTS / COMMANDES
   ========================================================================= */

type OverviewStats = {
  evenements: number;
  offres: number;
  reservations: number;
  chiffre_affaires: string; // renvoyé en string (Decimal) côté API
};

type TicketStatus = "VALIDE" | "UTILISE" | "ANNULE" | "EXPIRE";

type Ticket = {
  id: number;
  numero_billet: string;
  utilisateur: number;
  utilisateur_nom?: string | null;
  offre: number;
  offre_nom?: string | null;
  qr_code?: string | null; // peut être absent selon serializer/permissions
  prix_paye: string;
  statut: TicketStatus;
  date_achat?: string | null;
};

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

function isCanceledError(err: any) {
  return (
    err?.name === "CanceledError" ||
    err?.name === "AbortError" ||
    err?.code === "ERR_CANCELED"
  );
}

function toNumber(v: string | number | undefined | null): number {
  if (v === undefined || v === null) return 0;
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatNumber(value?: number | null) {
  if (value === undefined || value === null) return "—";
  return value.toLocaleString("fr-FR");
}

function formatCurrency(value?: number | string | null) {
  if (value === undefined || value === null) return "—";
  const n = toNumber(value);
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function asQrSrc(qr?: string | null) {
  if (!qr) return "";
  if (qr.startsWith("data:image")) return qr;
  return `data:image/png;base64,${qr}`;
}

function statusBadgeClass(statut: TicketStatus) {
  if (statut === "VALIDE") return "admin-badge admin-badge--ok";
  if (statut === "UTILISE") return "admin-badge admin-badge--warn";
  if (statut === "ANNULE") return "admin-badge admin-badge--danger";
  return "admin-badge admin-badge--muted";
}

function KpiCard(props: {
  label: string;
  value: string;
  hint: string;
  linkTo?: string;
  linkLabel?: string;
}) {
  return (
    <div className="admin-kpi-card">
      <div className="admin-kpi-card__label">{props.label}</div>
      <div className="admin-kpi-card__value">{props.value}</div>
      <div className="admin-kpi-card__hint">{props.hint}</div>

      {props.linkTo && props.linkLabel ? (
        <div style={{ marginTop: "0.7rem" }}>
          <Link className="admin-btn" to={props.linkTo}>
            {props.linkLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export default function DashboardPage() {
  const { showToast } = useToast();

  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState<string | null>(null);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsCount, setTicketsCount] = useState(0);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [errorTickets, setErrorTickets] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Recherche : saisie immédiate + search effectif (debounce)
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Modal QR
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrModalTitle, setQrModalTitle] = useState("");
  const [qrModalSrc, setQrModalSrc] = useState("");

  // Debounce recherche
  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  // Fetch overview stats
  useEffect(() => {
    const controller = new AbortController();

    async function fetchOverview() {
      try {
        setLoadingStats(true);
        setErrorStats(null);

        const { data } = await api.get<OverviewStats>("/stats/overview/", {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;
        setStats(data);
      } catch (err: any) {
        if (isCanceledError(err) || controller.signal.aborted) return;

        const status = err?.response?.status;
        if (status === 401) setErrorStats("Non authentifié (401). Connecte-toi.");
        else if (status === 403) setErrorStats("Accès refusé (403). Admin requis.");
        else if (status === 404) setErrorStats("Endpoint overview introuvable (404).");
        else setErrorStats("Statistiques indisponibles pour le moment.");
      } finally {
        if (!controller.signal.aborted) setLoadingStats(false);
      }
    }

    fetchOverview();
    return () => controller.abort();
  }, []);

  // Fetch tickets paginés
  useEffect(() => {
    const controller = new AbortController();

    async function fetchTickets() {
      try {
        setLoadingTickets(true);
        setErrorTickets(null);

        const params: Record<string, string | number> = {
          page,
          page_size: pageSize,
        };

        if (search) params.search = search;

        const { data } = await api.get<Paginated<Ticket>>("/billets/", {
          params,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        setTickets(data.results);
        setTicketsCount(data.count);
      } catch (err: any) {
        if (isCanceledError(err) || controller.signal.aborted) return;

        const status = err?.response?.status;
        if (status === 401) setErrorTickets("Non authentifié (401). Connecte-toi.");
        else if (status === 403) setErrorTickets("Accès refusé (403). Admin requis.");
        else setErrorTickets("Chargement des tickets impossible.");
      } finally {
        if (!controller.signal.aborted) setLoadingTickets(false);
      }
    }

    fetchTickets();
    return () => controller.abort();
  }, [page, pageSize, search]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(ticketsCount / pageSize)),
    [ticketsCount, pageSize]
  );

  // Evite page > totalPages si changement pageSize/recherche
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const reservationsTotal = useMemo(() => {
    return stats?.reservations ?? ticketsCount ?? 0;
  }, [stats?.reservations, ticketsCount]);

  const showError = errorStats ?? errorTickets;

  function openQrModal(ticket: Ticket) {
    const title = `QR Code — Billet ${ticket.numero_billet || ticket.id}`;
    const src = asQrSrc(ticket.qr_code ?? "");
    setQrModalTitle(title);
    setQrModalSrc(src);
    setQrModalOpen(true);
  }

  function closeQrModal() {
    setQrModalOpen(false);
    setQrModalTitle("");
    setQrModalSrc("");
  }

  async function copyText(text: string, label = "Copié") {
    try {
      await navigator.clipboard.writeText(text);
      showToast(label, "success");
    } catch {
      showToast("Impossible de copier (permissions navigateur).", "error");
    }
  }

  return (
    <div className="admin-page">
      <div style={{ marginBottom: "1.2rem" }}>
        <div className="admin-title">Tableau de bord</div>
        <div className="admin-subtitle">
          Synthèse + suivi des réservations (tickets émis) avec accès rapide aux modules principaux.
        </div>
      </div>

      {showError ? (
        <div className="admin-alert" role="alert">
          {showError}
        </div>
      ) : null}

      <div style={{ marginTop: "1rem" }} className="admin-kpi-grid">
        <KpiCard
          label="Épreuves"
          value={loadingStats ? "…" : formatNumber(stats?.evenements)}
          hint="Catalogue des événements sportifs."
          linkTo="/admin/evenements"
          linkLabel="Ouvrir"
        />
        <KpiCard
          label="Offres"
          value={loadingStats ? "…" : formatNumber(stats?.offres)}
          hint="Packs et tarification."
          linkTo="/admin/offres"
          linkLabel="Ouvrir"
        />
        <KpiCard
          label="Réservations"
          value={loadingStats ? "…" : formatNumber(reservationsTotal)}
          hint="Nombre total de billets émis."
          linkTo="/admin/billets"
          linkLabel="Voir"
        />
        <KpiCard
          label="Chiffre d’affaires"
          value={loadingStats ? "…" : formatCurrency(stats?.chiffre_affaires)}
          hint="Total ventes billetterie."
          linkTo="/admin/stats"
          linkLabel="Analyser"
        />
      </div>

      <section style={{ marginTop: "1.6rem" }}>
        <div className="admin-table-title">Modules principaux</div>

        <div style={{ marginTop: "0.85rem" }} className="admin-crud-grid">
          <div className="admin-crud-card">
            <div className="admin-crud-title">STATISTIQUES</div>
            <div className="admin-crud-desc">Analyse ventes, CA, tendances, top offres.</div>
            <div className="admin-crud-footer">
              <Link to="/admin/stats" className="admin-crud-link">
                Ouvrir →
              </Link>
            </div>
          </div>

          <div className="admin-crud-card">
            <div className="admin-crud-title">UTILISATEURS</div>
            <div className="admin-crud-desc">Comptes, statuts, détails, suivi.</div>
            <div className="admin-crud-footer">
              <Link to="/admin/utilisateurs" className="admin-crud-link">
                Ouvrir →
              </Link>
            </div>
          </div>

          <div className="admin-crud-card">
            <div className="admin-crud-title">COMMANDES</div>
            <div className="admin-crud-desc">Paiements, commandes, états, validation.</div>
            <div className="admin-crud-footer">
              <Link to="/admin/commandes" className="admin-crud-link">
                Ouvrir →
              </Link>
            </div>
          </div>

          <div className="admin-crud-card">
            <div className="admin-crud-title">ÉVÉNEMENTS</div>
            <div className="admin-crud-desc">Épreuves, dates, lieux, capacité.</div>
            <div className="admin-crud-footer">
              <Link to="/admin/evenements" className="admin-crud-link">
                Ouvrir →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="admin-table-wrap" style={{ marginTop: "1.6rem" }}>
        <div className="admin-table-head">
          <div>
            <div className="admin-table-title">Tickets / Réservations</div>
            <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginTop: "0.15rem" }}>
              Recherche + consultation des QR Codes.
            </div>
          </div>

          <div className="admin-table-tools">
            <input
              className="admin-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Recherche (n° billet, utilisateur, offre)"
            />

            <select
              className="admin-select"
              value={pageSize}
              onChange={(e) => {
                setPage(1);
                setPageSize(Number(e.target.value));
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>

            <button
              className="admin-btn"
              type="button"
              onClick={() => {
                setPage(1);
                setSearch(searchInput.trim());
              }}
            >
              Appliquer
            </button>
          </div>
        </div>

        {loadingTickets ? (
          <div className="admin-table-state">Chargement…</div>
        ) : tickets.length === 0 ? (
          <div className="admin-table-state">Aucun ticket trouvé.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Utilisateur</th>
                  <th>Offre</th>
                  <th className="admin-td-center">QR</th>
                  <th>Statut</th>
                  <th className="admin-td-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td>{t.numero_billet || t.id}</td>
                    <td>{t.utilisateur_nom ?? `Utilisateur #${t.utilisateur}`}</td>
                    <td>{t.offre_nom ?? `Offre #${t.offre}`}</td>

                    <td className="admin-td-center">
                      {t.qr_code ? (
                        <button
                          className="admin-btn admin-btn--sm"
                          type="button"
                          onClick={() => openQrModal(t)}
                        >
                          QR
                        </button>
                      ) : (
                        <span className="admin-td-muted">—</span>
                      )}
                    </td>

                    <td>
                      <span className={statusBadgeClass(t.statut)}>{t.statut}</span>
                    </td>

                    <td className="admin-td-right">
                      <Link
                        className="admin-btn admin-btn--sm"
                        to={`/admin/billets/${t.id}`}
                        style={{ marginRight: "0.4rem" }}
                      >
                        Détails
                      </Link>

                      <button
                        className="admin-btn admin-btn--sm"
                        type="button"
                        onClick={() => copyText(t.numero_billet, "Numéro copié")}
                        style={{ marginRight: "0.4rem" }}
                      >
                        Copier n°
                      </button>

                      {t.qr_code ? (
                        <button
                          className="admin-btn admin-btn--sm"
                          type="button"
                          onClick={() => copyText(asQrSrc(t.qr_code ?? ""), "QR copié")}
                        >
                          Copier QR
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="admin-table-footer">
              <div className="admin-table-footer__text">
                {ticketsCount.toLocaleString("fr-FR")} ticket(s) — page {page} / {totalPages}
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className="admin-btn admin-btn--sm"
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ←
                </button>
                <button
                  className="admin-btn admin-btn--sm"
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {qrModalOpen ? (
        <div
          className="admin-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={closeQrModal}
        >
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <div className="admin-modal__title">{qrModalTitle}</div>
              <button className="admin-btn admin-btn--sm" type="button" onClick={closeQrModal}>
                Fermer
              </button>
            </div>

            <div className="admin-modal__body">
              {qrModalSrc ? (
                <img className="admin-modal__qr" src={qrModalSrc} alt="QR Code" />
              ) : (
                <div className="admin-text-muted">QR indisponible</div>
              )}
            </div>

            <div className="admin-modal__footer">
              {qrModalSrc ? (
                <button
                  className="admin-btn admin-btn--sm"
                  type="button"
                  onClick={() => copyText(qrModalSrc, "QR copié")}
                >
                  Copier QR
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
