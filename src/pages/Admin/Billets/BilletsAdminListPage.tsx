import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/axiosClient";
import useToast from "@/hooks/useToast";
import "@/styles/admin.css";

type TicketStatus = "VALIDE" | "UTILISE" | "ANNULE" | "EXPIRE";

type Ticket = {
  id: number;
  numero_billet: string;
  utilisateur: number;
  utilisateur_nom?: string;
  offre: number;
  offre_nom?: string;
  qr_code: string;
  prix_paye?: string;
  statut: TicketStatus;
  date_achat?: string;
};

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

function asQrSrc(qr: string) {
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

export default function BilletsAdminListPage() {
  const { showToast } = useToast();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsCount, setTicketsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Recherche : saisie immédiate + search effectif (debounce)
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Modal QR
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrModalTitle, setQrModalTitle] = useState("");
  const [qrModalSrc, setQrModalSrc] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchTickets() {
      try {
        setLoading(true);
        setError(null);

        const params: Record<string, string | number> = {
          page,
          page_size: pageSize,
        };
        if (search) params.search = search;

        const { data } = await api.get<Paginated<Ticket>>("/billets/", {
          params,
          signal: controller.signal,
        });

        setTickets(data.results);
        setTicketsCount(data.count);
      } catch (err: any) {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
        console.error("Admin Billets: fetch error =", err);
        setError("Chargement des billets impossible.");
      } finally {
        setLoading(false);
      }
    }

    fetchTickets();
    return () => controller.abort();
  }, [page, pageSize, search]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(ticketsCount / pageSize)), [ticketsCount, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function openQrModal(ticket: Ticket) {
    setQrModalTitle(`QR Code — Billet ${ticket.numero_billet}`);
    setQrModalSrc(asQrSrc(ticket.qr_code));
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
      showToast(`${label} ✅`, "success");
    } catch {
      showToast("Impossible de copier (permissions navigateur).", "error");
    }
  }

  return (
    <div className="admin-page">
      <div style={{ marginBottom: "1.2rem" }}>
        <div className="admin-title">Billets / Tickets</div>
        <div className="admin-subtitle">
          Liste des billets émis, recherche et consultation des QR Codes (statut, utilisateur, offre).
        </div>
      </div>

      {error ? (
        <div className="admin-alert" role="alert">
          {error}
        </div>
      ) : null}

      <div className="admin-table-wrap" style={{ marginTop: "1rem" }}>
        <div className="admin-table-head">
          <div>
            <div className="admin-table-title">Liste des billets</div>
            <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginTop: "0.15rem" }}>
              {ticketsCount.toLocaleString("fr-FR")} billet(s) au total
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
              onClick={() => {
                setPage(1);
                setSearch(searchInput.trim());
              }}
            >
              Appliquer
            </button>
          </div>
        </div>

        {loading ? (
          <div className="admin-table-state">Chargement…</div>
        ) : tickets.length === 0 ? (
          <div className="admin-table-state">Aucun billet trouvé.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th># Billet</th>
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
                        <button className="admin-btn admin-btn--sm" onClick={() => openQrModal(t)}>
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
                      {/* Ajuste cette route si tu as une page détail admin */}
                      <Link
                        className="admin-btn admin-btn--sm"
                        to={`/admin/billets/${t.id}`}
                        style={{ marginRight: "0.4rem" }}
                      >
                        Détails
                      </Link>

                      <button
                        className="admin-btn admin-btn--sm"
                        onClick={() => copyText(t.numero_billet, "Numéro copié")}
                        style={{ marginRight: "0.4rem" }}
                      >
                        Copier n°
                      </button>

                      {t.qr_code ? (
                        <button
                          className="admin-btn admin-btn--sm"
                          onClick={() => copyText(asQrSrc(t.qr_code), "QR copié")}
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
                {ticketsCount.toLocaleString("fr-FR")} billet(s) — page {page} / {totalPages}
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="admin-btn admin-btn--sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  ←
                </button>
                <button
                  className="admin-btn admin-btn--sm"
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

      {/* Modal QR */}
      {qrModalOpen ? (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true" onClick={closeQrModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <div className="admin-modal__title">{qrModalTitle}</div>
              <button className="admin-btn admin-btn--sm" onClick={closeQrModal}>
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
                <button className="admin-btn admin-btn--sm" onClick={() => copyText(qrModalSrc, "QR copié")}>
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