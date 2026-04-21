//src/pages/Admin/Billets/BilletsAdminListPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { EBillet } from "@/types/billets";
import {
  listBillets,
  validerBillet,
  annulerBillet,
  deleteBillet,
  downloadBilletPdf,
  downloadBilletPng,
} from "@/api/billets.api";
import "@/styles/admin.css";

type BilletStatusFilter = "" | "VALIDE" | "UTILISE" | "ANNULE" | "EXPIRE";
type OrderingValue =
  | "-date_achat"
  | "date_achat"
  | "-date_utilisation"
  | "date_utilisation"
  | "-prix_paye"
  | "prix_paye"
  | "numero_billet"
  | "-numero_billet"
  | "statut"
  | "-statut";

function isCanceledError(err: any) {
  return err?.code === "ERR_CANCELED" || err?.name === "CanceledError";
}

function unwrap<T>(data: any): { rows: T[]; count: number } {
  if (Array.isArray(data)) return { rows: data, count: data.length };
  if (data && Array.isArray(data.results)) {
    return { rows: data.results, count: typeof data.count === "number" ? data.count : data.results.length };
  }
  return { rows: [], count: 0 };
}

function badgeClass(statut: string) {
  const s = (statut || "").toUpperCase();
  if (s === "VALIDE") return "admin-badge admin-badge--ok";
  if (s === "UTILISE") return "admin-badge admin-badge--warn";
  if (s === "ANNULE" || s === "EXPIRE") return "admin-badge admin-badge--danger";
  return "admin-badge admin-badge--muted";
}

function fmtDateTime(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR");
}

function triggerDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default function BilletsAdminListPage() {
  const [rows, setRows] = useState<EBillet[]>([]);
  const [count, setCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<BilletStatusFilter>("");
  const [ordering, setOrdering] = useState<OrderingValue>("-date_achat");

  const [busyId, setBusyId] = useState<number | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count, pageSize]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const params: Record<string, any> = {
          page,
          page_size: pageSize,
          ordering,
        };
        if (search) params.search = search;
        if (statusFilter) params.statut = statusFilter;

        const data = await listBillets(params as any);
        if (controller.signal.aborted) return;

        const u = unwrap<EBillet>(data);
        setRows(u.rows);
        setCount(u.count);

        const nextTotalPages = Math.max(1, Math.ceil(u.count / pageSize));
        if (page > nextTotalPages) setPage(nextTotalPages);
      } catch (e: any) {
        if (isCanceledError(e) || controller.signal.aborted) return;
        setError("Chargement des billets impossible.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [page, pageSize, search, statusFilter, ordering]);

  async function handleValidate(id: number) {
    const lieu = window.prompt("Lieu d’utilisation (optionnel) :", "Entrée A") ?? "";
    try {
      setBusyId(id);
      setError(null);
      await validerBillet(id, { lieu_utilisation: lieu || undefined });
      setRows((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                statut: "UTILISE",
                lieu_utilisation: lieu || b.lieu_utilisation,
                date_utilisation: new Date().toISOString(),
              }
            : b
        )
      );
    } catch {
      setError("Validation impossible (droits / statut).");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(id: number) {
    const ok = window.confirm("Annuler ce billet ?");
    if (!ok) return;
    try {
      setBusyId(id);
      setError(null);
      await annulerBillet(id);
      setRows((prev) => prev.map((b) => (b.id === id ? { ...b, statut: "ANNULE" } : b)));
    } catch {
      setError("Annulation impossible (droits / statut).");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: number) {
    const ok = window.confirm("Supprimer ce billet ? (irréversible)");
    if (!ok) return;
    try {
      setBusyId(id);
      setError(null);
      await deleteBillet(id);
      setRows((prev) => prev.filter((b) => b.id !== id));
      setCount((c) => Math.max(0, c - 1));
    } catch {
      setError("Suppression impossible (droits).");
    } finally {
      setBusyId(null);
    }
  }

  async function handlePdf(b: EBillet) {
    try {
      setBusyId(b.id);
      setError(null);
      const blob = await downloadBilletPdf(b.id);
      triggerDownload(blob, `${b.numero_billet}.pdf`);
    } catch {
      setError("Téléchargement PDF impossible.");
    } finally {
      setBusyId(null);
    }
  }

  async function handlePng(b: EBillet) {
    try {
      setBusyId(b.id);
      setError(null);
      const blob = await downloadBilletPng(b.id);
      triggerDownload(blob, `${b.numero_billet}.png`);
    } catch {
      setError("Téléchargement PNG impossible.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="admin-page">
      <div style={{ marginBottom: "1.2rem" }}>
        <div className="admin-title">Billets</div>
        <div className="admin-subtitle">
          Gestion des e-billets (QR code, validation, export PDF/PNG).{" "}
          <span className="admin-text-muted">{count.toLocaleString("fr-FR")} billet(s)</span>
        </div>
      </div>

      {error && (
        <div className="admin-alert" role="alert" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <div className="admin-table-wrap">
        <div className="admin-table-head">
          <div>
            <div className="admin-table-title">Liste des billets</div>
            <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginTop: "0.15rem" }}>
              Recherche + filtre statut + tri + pagination
            </div>
          </div>

          <div className="admin-table-tools">
            <input
              className="admin-input"
              placeholder="Recherche (numéro, utilisateur, offre...)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />

            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(e.target.value as BilletStatusFilter);
              }}
            >
              <option value="">Tous statuts</option>
              <option value="VALIDE">VALIDE</option>
              <option value="UTILISE">UTILISE</option>
              <option value="ANNULE">ANNULE</option>
              <option value="EXPIRE">EXPIRE</option>
            </select>

            <select
              className="admin-select"
              value={ordering}
              onChange={(e) => {
                setPage(1);
                setOrdering(e.target.value as OrderingValue);
              }}
            >
              <option value="-date_achat">Achat (récent)</option>
              <option value="date_achat">Achat (ancien)</option>
              <option value="-date_utilisation">Utilisation (récente)</option>
              <option value="date_utilisation">Utilisation (ancienne)</option>
              <option value="-prix_paye">Prix (desc)</option>
              <option value="prix_paye">Prix (asc)</option>
              <option value="numero_billet">Numéro (A→Z)</option>
              <option value="-numero_billet">Numéro (Z→A)</option>
              <option value="statut">Statut (A→Z)</option>
              <option value="-statut">Statut (Z→A)</option>
            </select>

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

            <Link className="admin-btn" to="/admin/billets/nouveau">
              + Créer
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="admin-table-state">Chargement…</div>
        ) : rows.length === 0 ? (
          <div className="admin-table-state">Aucun billet trouvé.</div>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Utilisateur</th>
                  <th>Offre</th>
                  <th className="admin-td-right">Prix</th>
                  <th className="admin-td-center">Statut</th>
                  <th>Dates</th>
                  <th className="admin-td-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((b) => {
                  const st = (b.statut || "").toUpperCase();
                  const canUse = st === "VALIDE";
                  const isBusy = busyId === b.id;

                  return (
                    <tr key={b.id}>
                      <td>
                        <Link to={`/admin/billets/${b.id}`} className="admin-crud-link">
                          {b.numero_billet}
                        </Link>
                        <div className="admin-td-muted" style={{ fontSize: "0.82rem", marginTop: 3 }}>
                          ID #{b.id}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 700 }}>{b.utilisateur_nom}</div>
                        <div className="admin-td-muted" style={{ fontSize: "0.82rem", marginTop: 3 }}>
                          user_id: {b.utilisateur}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 700 }}>{b.offre_nom}</div>
                        <div className="admin-td-muted" style={{ fontSize: "0.82rem", marginTop: 3 }}>
                          offre_id: {b.offre}
                        </div>
                      </td>

                      <td className="admin-td-right">{String(b.prix_paye)} €</td>

                      <td className="admin-td-center">
                        <span className={badgeClass(b.statut)}>{b.statut}</span>
                      </td>

                      <td className="admin-td-muted">
                        Achat: {fmtDateTime(b.date_achat)}
                        <br />
                        Utilisation: {fmtDateTime(b.date_utilisation)}
                        <br />
                        Lieu: {b.lieu_utilisation ?? "—"}
                      </td>

                      <td className="admin-td-right">
                        <div className="admin-actions">
                          <button className="admin-btn admin-btn--xs" onClick={() => handlePdf(b)} disabled={isBusy}>
                            PDF
                          </button>
                          <button className="admin-btn admin-btn--xs" onClick={() => handlePng(b)} disabled={isBusy}>
                            PNG
                          </button>

                          <Link className="admin-btn admin-btn--xs" to={`/admin/billets/${b.id}`}>
                            Éditer
                          </Link>

                          <button className="admin-btn admin-btn--xs" onClick={() => handleValidate(b.id)} disabled={!canUse || isBusy}>
                            Valider
                          </button>

                          <button className="admin-btn admin-btn--xs admin-btn--danger" onClick={() => handleCancel(b.id)} disabled={!canUse || isBusy}>
                            Annuler
                          </button>

                          <button className="admin-btn admin-btn--xs admin-btn--danger" onClick={() => handleDelete(b.id)} disabled={isBusy}>
                            Suppr
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="admin-table-footer">
              <div className="admin-table-footer__text">
                {count.toLocaleString("fr-FR")} billet(s) — page {page} / {totalPages}
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="admin-btn admin-btn--sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  ←
                </button>
                <button className="admin-btn admin-btn--sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}