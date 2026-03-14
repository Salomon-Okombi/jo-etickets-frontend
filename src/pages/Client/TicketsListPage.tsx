import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { EBillet } from "@/types/billets";
import { getBillet, downloadBilletPdf } from "@/api/billets.api";

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

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const billetId = Number(id);
  const navigate = useNavigate();

  const [billet, setBillet] = useState<EBillet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

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

  async function onDownloadPdf() {
    if (!billet) return;

    setDownloading(true);
    setError(null);

    try {
      const blob = await downloadBilletPdf(billet.id);
      triggerDownload(blob, `${billet.numero_billet}.pdf`);
    } catch {
      setError("Téléchargement du PDF impossible.");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) return <div style={{ padding: "2rem" }}>Chargement…</div>;
  if (!billet) return <div style={{ padding: "2rem" }}>{error ?? "Billet introuvable."}</div>;

  return (
    <div style={{ padding: "1.5rem" }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: "1rem" }}>
        ← Retour
      </button>

      <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>{billet.numero_billet}</h1>
      <div style={{ marginTop: 6, opacity: 0.85 }}>{billet.offre_nom}</div>

      {error && (
        <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", border: "1px solid rgba(220,38,38,0.35)", background: "rgba(220,38,38,0.08)", borderRadius: 12 }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 320px", gap: "1rem" }}>
        <div>
          <div style={{ opacity: 0.7 }}>Statut</div>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>{billet.statut}</div>

          <div style={{ opacity: 0.7 }}>Acheté le</div>
          <div style={{ marginBottom: 10 }}>{new Date(billet.date_achat).toLocaleString("fr-FR")}</div>

          <div style={{ opacity: 0.7 }}>Utilisé le</div>
          <div style={{ marginBottom: 10 }}>
            {billet.date_utilisation ? new Date(billet.date_utilisation).toLocaleString("fr-FR") : "—"}
          </div>

          <button onClick={onDownloadPdf} disabled={downloading} style={{ marginTop: 8 }}>
            {downloading ? "Téléchargement…" : "Télécharger le PDF"}
          </button>
        </div>

        <div>
          {billet.qr_code ? (
            <img
              src={`data:image/png;base64,${billet.qr_code}`}
              alt="QR code billet"
              style={{ width: "100%", borderRadius: 14, border: "1px solid rgba(15,23,42,0.12)" }}
            />
          ) : (
            <div style={{ opacity: 0.7 }}>QR indisponible</div>
          )}
        </div>
      </div>
    </div>
  );
}