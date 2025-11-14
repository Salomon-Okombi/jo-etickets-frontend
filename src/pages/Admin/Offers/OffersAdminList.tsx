// src/pages/Admin/Offers/OfferAdminList.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listOffers, deleteOffer, type Offer } from "@/api/offers.api";

export default function OfferAdminList() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    try {
      const data = await listOffers();
      // Si listOffers() renvoie une pagination {results}, adapte ici :
      const rows: Offer[] = Array.isArray(data) ? data : (data as any).results;
      setOffers(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onDelete(id: number) {
    if (!window.confirm("Supprimer définitivement cette offre ?")) return;
    setDeletingId(id);
    try {
      await deleteOffer(id);
      setOffers((prev) => prev.filter((o) => o.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Offres — Administration</h1>
        <Link to="/admin/offers/create" className="btn btn-primary">➕ Créer</Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : offers.length === 0 ? (
        <div className="alert">
          <span>Aucune offre pour l’instant.</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Événement</th>
                <th>Prix</th>
                <th>Stock (disp./total)</th>
                <th>Début</th>
                <th>Fin</th>
                <th className="w-44 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((o) => (
                <tr key={o.id}>
                  <td className="font-medium">{o.nom_offre}</td>
                  <td>{o.evenement}</td>
                  <td>{o.prix} €</td>
                  <td>
                    {o.stock_disponible}/{o.stock_total}
                  </td>
                  <td>{o.date_debut_vente?.slice(0, 10) ?? "-"}</td>
                  <td>{o.date_fin_vente?.slice(0, 10) ?? "-"}</td>
                  <td className="flex gap-2 justify-end">
                    <button
                      className="btn btn-sm"
                      onClick={() => navigate(`/admin/offers/${o.id}/edit`)}
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      className="btn btn-sm btn-error"
                      disabled={deletingId === o.id}
                      onClick={() => onDelete(o.id)}
                    >
                      {deletingId === o.id ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        "Supprimer"
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
