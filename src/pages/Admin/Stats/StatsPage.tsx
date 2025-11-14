// src/pages/Admin/Stats/StatsPage.tsx
import React from "react";
import useAdminStats, {
  type OfferStats,
} from "@/features/admin/hooks/useAdminStats";
import {
  formatCurrency,
  formatNumber,
  formatDateTime,
} from "@/utils/format";

export default function StatsPage() {
  const { global, perOffer, loading, reload } = useAdminStats();

  const list: OfferStats[] = perOffer ?? [];

  function exportCSV() {
    const rows = [
      [
        "Offre",
        "Ventes",
        "Chiffre d'affaires (€)",
        "Moy. ventes/jour",
        "Dernière MAJ",
        "Pic (heure)",
      ],
      ...list.map((s) => [
        s.offre_nom ?? `#${s.offre_id}`,
        String(s.nombre_ventes),
        String(s.chiffre_affaires),
        "", // pas de moyenne/jour dans ton type actuel
        "", // pas de date_derniere_maj dans ton type actuel
        "", // pas de pic_ventes_heure dans ton type actuel
      ]),
    ];

    const csv = rows.map((r) => r.map(escapeCSV).join(",")).join("\n");
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stats_offres.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function escapeCSV(v: string) {
    if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold">
          Statistiques — Administration
        </h1>
        <div className="flex gap-2">
          <button className="btn" onClick={reload} disabled={loading}>
            {loading ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              "Actualiser"
            )}
          </button>
          <button
            className="btn btn-outline"
            onClick={exportCSV}
            disabled={loading || !list.length}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Cartes globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Ventes totales</div>
            <div className="stat-value">
              {formatNumber(global?.ventes_totales ?? 0)}
            </div>
            <div className="stat-desc">Toutes offres confondues</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Chiffre d’affaires</div>
            <div className="stat-value">
              {formatCurrency(
                Number(global?.chiffre_affaires_total ?? 0)
              )}
            </div>
            <div className="stat-desc">Montant cumulé</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Nombre d’offres</div>
            <div className="stat-value">
              {formatNumber(list.length)}
            </div>
            <div className="stat-desc">Suivies en analytics</div>
          </div>
        </div>
      </div>

      {/* Tableau par offre */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Détail par offre</h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : list.length === 0 ? (
            <div className="alert">
              <span>Aucune statistique pour le moment.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Offre</th>
                    <th>Ventes</th>
                    <th>Chiffre d’affaires</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((s) => (
                    <tr key={s.offre_id}>
                      <td className="font-medium">
                        {s.offre_nom ?? `#${s.offre_id}`}
                      </td>
                      <td>{formatNumber(s.nombre_ventes)}</td>
                      <td>
                        {formatCurrency(
                          Number(s.chiffre_affaires ?? 0)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
