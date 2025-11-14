// src/pages/Admin/DashboardPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useAdminStats from "@/features/admin/hooks/useAdminStats";
import useAdminUsers from "@/features/admin/hooks/useAdminUsers";
import useAdminEvents from "@/features/admin/hooks/useAdminEvents";
import useAdminOffers from "@/features/admin/hooks/useAdminOffers";
import { formatCurrency, formatDateTime, formatNumber } from "@/utils/format";

export default function DashboardPage() {
  // Stats globales + tops
  const {
    global,
    topOffersByRevenue,
    topOffersBySales,
    loading: statsLoading,
    reload: reloadStats,
  } = useAdminStats();

  // Compteurs rapides
  const {
    list: usersList,
    loading: usersLoading,
    reload: reloadUsers,
  } = useAdminUsers();

  const {
    list: eventsList,
    loading: eventsLoading,
    reload: reloadEvents,
  } = useAdminEvents();

  const {
    list: offersList,
    loading: offersLoading,
    reload: reloadOffers,
  } = useAdminOffers();

  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    void Promise.all([
      reloadStats(),
      reloadUsers(),
      reloadEvents(),
      reloadOffers(),
    ]).finally(() => setInitialLoad(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalUsers = usersList?.count ?? 0;
  const totalEvents = eventsList?.count ?? 0;
  const totalOffers = offersList?.count ?? 0;

  const g = global ?? {
    ventes_totales: 0,
    chiffre_affaires_total: "0",
    derniere_maj: null as string | null,
  };

  const busy =
    initialLoad || statsLoading || usersLoading || eventsLoading || offersLoading;

  const topRev = useMemo(
    () => (topOffersByRevenue ?? []).slice(0, 5),
    [topOffersByRevenue]
  );
  const topSales = useMemo(
    () => (topOffersBySales ?? []).slice(0, 5),
    [topOffersBySales]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl md:text-3xl font-bold">Tableau de bord</h1>
        <div className="flex gap-2">
          <button
            className="btn btn-outline"
            onClick={() =>
              Promise.all([
                reloadStats(),
                reloadUsers(),
                reloadEvents(),
                reloadOffers(),
              ])
            }
            disabled={busy}
          >
            {busy ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              "Actualiser"
            )}
          </button>
          <Link className="btn" to="/admin/stats">
            Voir les statistiques détaillées
          </Link>
        </div>
      </div>

      {/* Cartes KPI */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Chiffre d’affaires"
          value={formatCurrency(Number(g.chiffre_affaires_total || 0))}
          subtitle={
            g.derniere_maj
              ? `MAJ : ${formatDateTime(g.derniere_maj)}`
              : "—"
          }
          icon="💶"
          loading={busy}
        />
        <KpiCard
          title="Ventes totales"
          value={formatNumber(g.ventes_totales)}
          subtitle="Billets générés"
          icon="🎫"
          loading={busy}
        />
        <KpiCard
          title="Offres publiées"
          value={formatNumber(totalOffers)}
          subtitle={
            <Link className="link" to="/admin/offers">
              Gérer les offres
            </Link>
          }
          icon="🧩"
          loading={busy}
        />
        <KpiCard
          title="Utilisateurs"
          value={formatNumber(totalUsers)}
          subtitle={
            <Link className="link" to="/admin/users">
              Gérer les utilisateurs
            </Link>
          }
          icon="👥"
          loading={busy}
        />
      </section>

      {/* Top listes */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CardTable
          title="Top offres — Chiffre d’affaires"
          cols={["Offre", "CA", "Ventes"]}
          loading={busy}
          emptyLabel="Aucune donnée"
          rows={topRev.map((o) => [
            <Link
              key={`r-${o.offre_id}`}
              to={`/admin/offers?focus=${o.offre_id}`}
              className="link"
            >
              {o.offre_nom ?? `Offre #${o.offre_id}`}
            </Link>,
            formatCurrency(Number(o.chiffre_affaires || 0)),
            formatNumber(o.nombre_ventes || 0),
          ])}
        />
        <CardTable
          title="Top offres — Volume de ventes"
          cols={["Offre", "Ventes", "CA"]}
          loading={busy}
          emptyLabel="Aucune donnée"
          rows={topSales.map((o) => [
            <Link
              key={`s-${o.offre_id}`}
              to={`/admin/offers?focus=${o.offre_id}`}
              className="link"
            >
              {o.offre_nom ?? `Offre #${o.offre_id}`}
            </Link>,
            formatNumber(o.nombre_ventes || 0),
            formatCurrency(Number(o.chiffre_affaires || 0)),
          ])}
        />
      </section>

      {/* Derniers éléments */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardTable
          title="Derniers événements créés"
          cols={["Nom", "Date", "Lieu", "Actions"]}
          loading={busy}
          emptyLabel="Aucun événement"
          rows={(eventsList?.results ?? []).slice(0, 5).map((ev) => [
            ev.nom,
            ev.date_evenement ? formatDateTime(ev.date_evenement) : "—",
            ev.lieu_evenement ?? "—",
            <Link
              key={`e-${ev.id}`}
              to={`/admin/events/${ev.id}/edit`}
              className="btn btn-xs"
            >
              Ouvrir
            </Link>,
          ])}
        />
        <CardTable
          title="Dernières offres créées"
          cols={["Nom", "Prix", "Stock", "Actions"]}
          loading={busy}
          emptyLabel="Aucune offre"
          rows={(offersList?.results ?? []).slice(0, 5).map((of) => [
            of.nom_offre,
            formatCurrency(Number(of.prix || 0)),
            formatNumber(of.stock_disponible ?? 0),
            <Link
              key={`o-${of.id}`}
              to={`/admin/offers/${of.id}/edit`}
              className="btn btn-xs"
            >
              Ouvrir
            </Link>,
          ])}
        />
      </section>
    </div>
  );
}

/* =================================================================== */
/* UI helpers */
/* =================================================================== */

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  loading,
}: {
  title: string;
  value: string | number;
  subtitle?: React.ReactNode;
  icon?: string;
  loading?: boolean;
}) {
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-70">{title}</p>
            <p className="text-2xl md:text-3xl font-bold mt-1">
              {loading ? "…" : value}
            </p>
            {subtitle && (
              <p className="text-xs opacity-60 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="text-3xl">{icon}</div>
        </div>
      </div>
    </div>
  );
}

function CardTable({
  title,
  cols,
  rows,
  loading,
  emptyLabel = "Aucune donnée",
}: {
  title: string;
  cols: string[];
  rows: React.ReactNode[][];
  loading?: boolean;
  emptyLabel?: string;
}) {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body p-0">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <h2 className="card-title">{title}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                {cols.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={cols.length}>
                    <div className="flex justify-center py-10">
                      <span className="loading loading-spinner loading-lg" />
                    </div>
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={cols.length}>
                    <div className="alert">
                      <span>{emptyLabel}</span>
                    </div>
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((cell, j) => (
                      <td key={`${i}-${j}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
