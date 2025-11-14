import React, { useEffect, useState } from "react";
import {
  listTickets,
  downloadTicketPng,
  type Ticket,
  type Paginated,
} from "@/api/tickets.api";
import { formatDateTime } from "@/utils/format";
import { Link } from "react-router-dom";
import useToast from "@/hooks/useToast";

export default function TicketsListPage() {
  const { toast } = useToast();
  const [pageData, setPageData] = useState<Paginated<Ticket> | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await listTickets(); // res: Paginated<Ticket>
      setPageData(res);
    } catch {
      toast.error("Impossible de charger les billets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleDownload(id: number, filename: string) {
    try {
      setDownloadingId(id);
      const blob = await downloadTicketPng(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Téléchargement impossible.");
    } finally {
      setDownloadingId(null);
    }
  }

  const tickets: Ticket[] = pageData?.results ?? [];

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="p-6">
        <div className="alert">
          <span>Aucun billet pour le moment.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Mes billets</h1>
        <button className="btn btn-outline" onClick={load}>
          Actualiser
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tickets.map((t) => (
          <div key={t.id} className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title">Billet #{t.numero_billet}</h2>
              <p className="text-sm opacity-70">
                Offre #{t.offre} — {t.statut}
              </p>
              <p className="text-xs opacity-60">
                Acheté le {formatDateTime(t.date_creation ?? "")}
              </p>

              <div className="flex gap-2 justify-end mt-2">
                <Link className="btn btn-sm" to={`/tickets/${t.id}`}>
                  Détails
                </Link>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => handleDownload(t.id, t.numero_billet)}
                  disabled={downloadingId === t.id}
                >
                  {downloadingId === t.id ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    "Télécharger"
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}