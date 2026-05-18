import { useEffect, useState } from "react";
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
        if (!controller.signal.aborted) setBillet(data);
      } catch (e: any) {
        if (isCanceledError(e) || controller.signal.aborted) return;
        setError("Impossible de charger ce billet.");
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
      setError("Téléchargement du billet impossible.");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) return <div className="ticket-page__state">Chargement du billet…</div>;
  if (!billet) return <div className="ticket-page__state">{error ?? "Billet introuvable."}</div>;

  return (
    <div className="ticket-page">
      <button className="ticket-back" onClick={() => navigate(-1)}>
        ← Retour à mes billets
      </button>

      <h1 className="ticket-title">🎟️ {billet.numero_billet}</h1>
      <p className="ticket-subtitle">{billet.offre_nom}</p>

      {error && <div className="ticket-error">{error}</div>}

      <div className="ticket-grid">
        <div className="ticket-infos">
          <div className="ticket-info">
            <span>Statut</span>
            <strong>{billet.statut}</strong>
          </div>

          <div className="ticket-info">
            <span>Acheté le</span>
            <strong>{new Date(billet.date_achat).toLocaleString("fr-FR")}</strong>
          </div>

          <div className="ticket-info">
            <span>Utilisé le</span>
            <strong>
              {billet.date_utilisation
                ? new Date(billet.date_utilisation).toLocaleString("fr-FR")
                : "—"}
            </strong>
          </div>

          <button className="ticket-download" onClick={onDownloadPdf} disabled={downloading}>
            {downloading ? "Téléchargement…" : "📄 Télécharger le billet PDF"}
          </button>
        </div>

        <div className="ticket-qr">
          {billet.qr_code ? (
            <img
              src={`data:image/png;base64,${billet.qr_code}`}
              alt="QR code du billet"
            />
          ) : (
            <div className="ticket-qr--empty">QR code indisponible</div>
          )}
        </div>
      </div>
    </div>
  );
}