import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import type { EBillet } from "@/types/billets";
import {
  getBillet,
  annulerBillet,
  validerBillet,
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

export default function BilletAdminDetailPage() {
  const { id } = useParams<{ id: string }>();
  const billetId = Number(id);
  const navigate = useNavigate();

  const [billet, setBillet] = useState<EBillet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [busyDownload, setBusyDownload] = useState<"PDF" | "PNG" | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await getBillet(billetId);

        if (controller.signal.aborted) return;
        setBillet(data);
      } catch (e: any) {
        if (isCanceledError(e) || controller.signal.aborted) return;
        setError("Impossible de charger le billet.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    if (Number.isFinite(billetId) && billetId > 0) load();
    return () => controller.abort();
  }, [billetId]);

  async function onValidate() {
    if (!billet) return;

    const lieu = window.prompt("Lieu d’utilisation (optionnel) :", "Entrée A") ?? "";

    setBusy(true);
    setError(null);

    try {
      await validerBillet(billet.id, { lieu_utilisation: lieu || undefined });

      setBillet({
        ...billet,
        statut: "UTILISE",
        lieu_utilisation: lieu || billet.lieu_utilisation,
        date_utilisation: new Date().toISOString(),
      });
    } catch {
      setError("Validation impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function onCancel() {
    if (!billet) return;

    const ok = window.confirm("Annuler ce billet ?");
    if (!ok) return;

    setBusy(true);
    setError(null);

    try {
      await annulerBillet(billet.id);
      setBillet({ ...billet, statut: "ANNULE" });
    } catch {
      setError("Annulation impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function onDownloadPdf() {
    if (!billet) return;

    setBusyDownload("PDF");
    setError(null);

    try {
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

    setBusyDownload("PNG");
    setError(null);

    try {
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

  const isValide = (billet.statut || "").toUpperCase() === "VALIDE";

  return (
    <div className="admin-page">
      <div style={{ marginBottom: "1rem" }}>
        <div className="admin-title">Détail billet</div>
        <div className="admin-subtitle">{billet.numero_billet}</div>
      </div>

      {error && (
        <div className="admin-alert" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <button className="admin-btn admin-btn--ghost" onClick={() => navigate(-1)}>
          ← Retour
        </button>

        <button className="admin-btn" type="button" onClick={onDownloadPdf} disabled={busyDownload !== null}>
          {busyDownload === "PDF" ? "Téléchargement…" : "PDF"}
        </button>

        <button className="admin-btn admin-btn--ghost" type="button" onClick={onDownloadPng} disabled={busyDownload !== null}>
          {busyDownload === "PNG" ? "Téléchargement…" : "PNG"}
        </button>

        <button className="admin-btn" onClick={onValidate} disabled={busy || !isValide}>
          Valider
        </button>

        <button className="admin-btn admin-btn--danger" onClick={onCancel} disabled={busy || !isValide}>
          Annuler
        </button>
      </div>

      <div className="admin-table-wrap" style={{ padding: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1rem", alignItems: "start" }}>
          <div>
            <div className="admin-text-muted">Utilisateur</div>
            <div style={{ fontWeight: 800, marginBottom: "0.6rem" }}>{billet.utilisateur_nom}</div>

            <div className="admin-text-muted">Offre</div>
            <div style={{ fontWeight: 700, marginBottom: "0.6rem" }}>{billet.offre_nom}</div>

            <div className="admin-text-muted">Prix payé</div>
            <div style={{ marginBottom: "0.6rem" }}>{String(billet.prix_paye)} €</div>

            <div className="admin-text-muted">Statut</div>
            <div style={{ marginBottom: "0.6rem" }}>{billet.statut}</div>

            <div className="admin-text-muted">Acheté le</div>
            <div style={{ marginBottom: "0.6rem" }}>
              {new Date(billet.date_achat).toLocaleString("fr-FR")}
            </div>

            <div className="admin-text-muted">Utilisé le</div>
            <div>{billet.date_utilisation ? new Date(billet.date_utilisation).toLocaleString("fr-FR") : "—"}</div>

            <div className="admin-text-muted" style={{ marginTop: "0.6rem" }}>
              Lieu
            </div>
            <div>{billet.lieu_utilisation ?? "—"}</div>
          </div>

          <div>
            <div className="admin-text-muted" style={{ marginBottom: "0.4rem" }}>
              QR Code
            </div>
            {billet.qr_code ? (
              <img
                src={`data:image/png;base64,${billet.qr_code}`}
                alt="QR code billet"
                style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(15,23,42,0.12)" }}
              />
            ) : (
              <div className="admin-text-muted">QR indisponible</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}