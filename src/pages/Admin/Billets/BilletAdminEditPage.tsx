import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import type { EBillet, EBilletUpdatePayload } from "@/types/billets";
import {
  getBillet,
  updateBillet,
  deleteBillet,
  downloadBilletPdf,
  downloadBilletPng,
} from "@/api/billets.api";
import "@/styles/admin.css";

function isCanceledError(err: any) {
  return err?.code === "ERR_CANCELED" || err?.name === "CanceledError";
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

export default function BilletAdminEditPage() {
  const { id } = useParams<{ id: string }>();
  const billetId = Number(id);
  const navigate = useNavigate();

  const [billet, setBillet] = useState<EBillet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busyDownload, setBusyDownload] = useState<"PDF" | "PNG" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [utilisateur, setUtilisateur] = useState<number | "">("");
  const [offre, setOffre] = useState<number | "">("");
  const [prix_paye, setPrixPaye] = useState<number | "">("");
  const [statut, setStatut] = useState<string>("VALIDE");
  const [lieu_utilisation, setLieu] = useState<string>("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await getBillet(billetId);
        if (controller.signal.aborted) return;

        setBillet(data);
        setUtilisateur(data.utilisateur);
        setOffre(data.offre);

        const p = typeof data.prix_paye === "string" ? Number(data.prix_paye) : (data.prix_paye as number);
        setPrixPaye(Number.isFinite(p) ? p : "");

        setStatut(data.statut);
        setLieu(data.lieu_utilisation ?? "");
      } catch (e: any) {
        if (isCanceledError(e)) return;
        setError("Impossible de charger le billet.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    if (Number.isFinite(billetId) && billetId > 0) load();
    return () => controller.abort();
  }, [billetId]);

  const canSubmit = utilisateur !== "" && offre !== "";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    setError(null);

    try {
      const payload: EBilletUpdatePayload = {
        utilisateur: Number(utilisateur),
        offre: Number(offre),
        prix_paye: prix_paye === "" ? undefined : Number(prix_paye),
        statut,
        lieu_utilisation: lieu_utilisation.trim() || null,
      };

      const updated = await updateBillet(billetId, payload);
      setBillet(updated);
      navigate("/admin/billets");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 400) setError("Données invalides.");
      else if (status === 401) setError("Session expirée.");
      else if (status === 403) setError("Accès refusé.");
      else setError("Erreur lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    const ok = window.confirm("Supprimer ce billet ? (irréversible)");
    if (!ok) return;

    setDeleting(true);
    setError(null);

    try {
      await deleteBillet(billetId);
      navigate("/admin/billets");
    } catch {
      setError("Suppression impossible.");
    } finally {
      setDeleting(false);
    }
  }

  async function onDownloadPdf() {
    if (!billet) return;
    try {
      setBusyDownload("PDF");
      setError(null);
      const blob = await downloadBilletPdf(billet.id);
      triggerDownload(blob, `${billet.numero_billet}.pdf`);
    } catch {
      setError("Téléchargement PDF impossible.");
    } finally {
      setBusyDownload(null);
    }
  }

  async function onDownloadPng() {
    if (!billet) return;
    try {
      setBusyDownload("PNG");
      setError(null);
      const blob = await downloadBilletPng(billet.id);
      triggerDownload(blob, `${billet.numero_billet}.png`);
    } catch {
      setError("Téléchargement PNG impossible.");
    } finally {
      setBusyDownload(null);
    }
  }

  if (loading) return <div className="admin-table-state">Chargement…</div>;

  if (!billet) {
    return (
      <div className="admin-page">
        <div className="admin-alert">{error ?? "Billet introuvable."}</div>
        <Link className="admin-btn admin-btn--ghost" to="/admin/billets">
          ← Retour
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div style={{ marginBottom: "1rem" }}>
        <div className="admin-title">Éditer un billet</div>
        <div className="admin-subtitle">{billet.numero_billet}</div>
      </div>

      {error && (
        <div className="admin-alert" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <Link className="admin-btn admin-btn--ghost" to="/admin/billets">
          ← Retour
        </Link>

        <button className="admin-btn" type="button" onClick={onDownloadPdf} disabled={busyDownload !== null}>
          {busyDownload === "PDF" ? "Téléchargement…" : "PDF"}
        </button>

        <button className="admin-btn admin-btn--ghost" type="button" onClick={onDownloadPng} disabled={busyDownload !== null}>
          {busyDownload === "PNG" ? "Téléchargement…" : "PNG"}
        </button>

        <button className="admin-btn admin-btn--danger" onClick={onDelete} disabled={deleting}>
          {deleting ? "Suppression…" : "Supprimer"}
        </button>
      </div>

      <div className="admin-table-wrap" style={{ padding: "1rem" }}>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: "1rem", maxWidth: 720 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <div className="admin-text-muted">Utilisateur (ID) *</div>
              <input
                className="admin-input"
                type="number"
                min={1}
                value={utilisateur}
                onChange={(e) => setUtilisateur(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>

            <div>
              <div className="admin-text-muted">Offre (ID) *</div>
              <input
                className="admin-input"
                type="number"
                min={1}
                value={offre}
                onChange={(e) => setOffre(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <div className="admin-text-muted">Prix payé</div>
            <input
              className="admin-input"
              type="number"
              min={0}
              step="0.01"
              value={prix_paye}
              onChange={(e) => setPrixPaye(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>

          <div>
            <div className="admin-text-muted">Statut</div>
            <select className="admin-select" value={statut} onChange={(e) => setStatut(e.target.value)}>
              <option value="VALIDE">VALIDE</option>
              <option value="UTILISE">UTILISE</option>
              <option value="ANNULE">ANNULE</option>
              <option value="EXPIRE">EXPIRE</option>
            </select>
          </div>

          <div>
            <div className="admin-text-muted">Lieu d'utilisation</div>
            <input className="admin-input" value={lieu_utilisation} onChange={(e) => setLieu(e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1rem", alignItems: "start" }}>
            <div>
              <div className="admin-text-muted">QR Code</div>
              <div className="admin-text-muted" style={{ fontSize: "0.85rem", marginTop: "0.2rem" }}>
                {billet.qr_code ? "QR disponible" : "QR indisponible"}
              </div>
            </div>
            <div>
              {billet.qr_code ? (
                <img
                  src={`data:image/png;base64,${billet.qr_code}`}
                  alt="QR code billet"
                  style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(15,23,42,0.12)" }}
                />
              ) : null}
            </div>
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