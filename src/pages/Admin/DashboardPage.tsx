// src/pages/Admin/DashboardPage.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/api/axiosClient";

type OverviewStats = {
  nb_evenements?: number;
  nb_offres?: number;
  nb_commandes?: number;
  nb_utilisateurs?: number;
  chiffre_affaires?: number; // en euros
};

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chargement des stats globales (si ton backend expose /stats/overview/)
  useEffect(() => {
    let mounted = true;

    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);

        // 🔁 Adapte l’URL si ton backend utilise une autre route
        const { data } = await api.get<OverviewStats>("/stats/overview/");
        if (!mounted) return;
        setStats(data);
      } catch (err) {
        console.error("Erreur chargement stats overview :", err);
        if (!mounted) return;
        // On ne bloque pas le dashboard si ça échoue
        setError(
          "Certaines statistiques ne sont pas disponibles pour le moment."
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchStats();
    return () => {
      mounted = false;
    };
  }, []);

  const formatNumber = (value: number | undefined) => {
    if (value === undefined || value === null) return "--";
    return value.toLocaleString("fr-FR");
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return "--";
    return value.toLocaleString("fr-FR", {
      style: "currency",
      currency: "EUR",
    });
  };

  return (
    <div className="space-y-8">
      {/* ==== En-tête ==== */}
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Tableau de bord administrateur
        </h1>
        <p className="text-sm md:text-base text-slate-300 max-w-2xl">
          Supervise la billetterie des Jeux Olympiques : épreuves, offres,
          commandes et utilisateurs. Ce tableau de bord regroupe les accès aux
          principaux écrans de gestion (CRUD) et un résumé des statistiques.
        </p>
      </header>

      {/* ==== Alerte éventuelle sur les stats ==== */}
      {error && (
        <div className="rounded-lg border border-amber-500/60 bg-amber-500/10 px-4 py-2 text-sm text-amber-100">
          {error}
        </div>
      )}

      {/* ==== Bloc 1 : Vue d’ensemble / chiffres clés ==== */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-3">
          Vue d&apos;ensemble de la billetterie
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {/* Événements */}
          <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-900/80 to-slate-900 p-4 shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Épreuves
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-200">
                Catalogue
              </span>
            </div>
            <div className="text-3xl font-bold text-white">
              {loading ? "…" : formatNumber(stats?.nb_evenements)}
            </div>
            <p className="text-xs text-slate-400">
              Nombre total d&apos;épreuves configurées dans la billetterie.
            </p>
            <Link
              to="/admin/evenements"
              className="mt-auto text-xs text-pink-300 hover:text-pink-200 underline underline-offset-2"
            >
              Gérer les événements →
            </Link>
          </div>

          {/* Offres */}
          <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-900/80 to-slate-900 p-4 shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Offres
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-200">
                Tarifs
              </span>
            </div>
            <div className="text-3xl font-bold text-white">
              {loading ? "…" : formatNumber(stats?.nb_offres)}
            </div>
            <p className="text-xs text-slate-400">
              Formules Solo, Duo, Famille et autres packs disponibles.
            </p>
            <Link
              to="/admin/offres"
              className="mt-auto text-xs text-pink-300 hover:text-pink-200 underline underline-offset-2"
            >
              Gérer les offres →
            </Link>
          </div>

          {/* Commandes */}
          <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-900/80 to-slate-900 p-4 shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Commandes
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-200">
                Ventes
              </span>
            </div>
            <div className="text-3xl font-bold text-white">
              {loading ? "…" : formatNumber(stats?.nb_commandes)}
            </div>
            <p className="text-xs text-slate-400">
              Nombre de commandes enregistrées sur la plateforme.
            </p>
            <Link
              to="/admin/commandes"
              className="mt-auto text-xs text-pink-300 hover:text-pink-200 underline underline-offset-2"
            >
              Voir les commandes →
            </Link>
          </div>

          {/* Utilisateurs & CA */}
          <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-900/80 to-slate-900 p-4 shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Utilisateurs & CA
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-200">
                Synthèse
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <div>
                <div className="text-3xl font-bold text-white">
                  {loading ? "…" : formatNumber(stats?.nb_utilisateurs)}
                </div>
                <p className="text-xs text-slate-400">comptes créés</p>
              </div>
              <div className="ml-auto text-right">
                <div className="text-sm font-semibold text-emerald-300">
                  {loading ? "…" : formatCurrency(stats?.chiffre_affaires)}
                </div>
                <p className="text-xs text-slate-400">
                  chiffre d&apos;affaires total
                </p>
              </div>
            </div>
            <Link
              to="/admin/utilisateurs"
              className="mt-auto text-xs text-pink-300 hover:text-pink-200 underline underline-offset-2"
            >
              Gérer les utilisateurs →
            </Link>
          </div>
        </div>
      </section>

      {/* ==== Bloc 2 : Espace CRUD par domaine ==== */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-3">
          Espace de gestion (CRUD)
        </h2>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {/* CRUD Utilisateurs */}
          <div className="group rounded-xl border border-slate-700 bg-slate-900/80 p-4 flex flex-col gap-3 hover:border-pink-400/80 hover:bg-slate-900 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Gestion des utilisateurs
                </h3>
                <p className="text-xs text-slate-400">
                  Comptes clients et administrateurs, type de compte, activités.
                </p>
              </div>
              <span className="text-xl">👥</span>
            </div>

            <ul className="text-xs text-slate-300 space-y-1 mt-1">
              <li>• Consultation de tous les comptes</li>
              <li>• Détail d&apos;un utilisateur</li>
              <li>• Vérification des droits (CLIENT / ADMIN)</li>
            </ul>

            <div className="mt-auto flex flex-col gap-1 pt-2">
              <Link
                to="/admin/utilisateurs"
                className="text-xs text-pink-300 group-hover:text-pink-200 underline underline-offset-2"
              >
                Ouvrir la liste des utilisateurs →
              </Link>
            </div>
          </div>

          {/* CRUD Événements */}
          <div className="group rounded-xl border border-slate-700 bg-slate-900/80 p-4 flex flex-col gap-3 hover:border-pink-400/80 hover:bg-slate-900 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Gestion des épreuves
                </h3>
                <p className="text-xs text-slate-400">
                  Configuration des événements : date, lieu, discipline.
                </p>
              </div>
              <span className="text-xl">🏟️</span>
            </div>

            <ul className="text-xs text-slate-300 space-y-1 mt-1">
              <li>• Créer / modifier / supprimer une épreuve</li>
              <li>• Lier les épreuves aux offres de billetterie</li>
            </ul>

            <div className="mt-auto flex flex-col gap-1 pt-2">
              <Link
                to="/admin/evenements"
                className="text-xs text-pink-300 group-hover:text-pink-200 underline underline-offset-2"
              >
                Voir toutes les épreuves →
              </Link>
              <Link
                to="/admin/evenements/nouveau"
                className="text-xs text-amber-300 group-hover:text-amber-200 underline underline-offset-2"
              >
                Créer une nouvelle épreuve →
              </Link>
            </div>
          </div>

          {/* CRUD Offres */}
          <div className="group rounded-xl border border-slate-700 bg-slate-900/80 p-4 flex flex-col gap-3 hover:border-pink-400/80 hover:bg-slate-900 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Gestion des offres
                </h3>
                <p className="text-xs text-slate-400">
                  Tarifs, stocks, type d&apos;offre (Solo, Duo, Famille…).
                </p>
              </div>
              <span className="text-xl">🎟️</span>
            </div>

            <ul className="text-xs text-slate-300 space-y-1 mt-1">
              <li>• Créer / modifier / supprimer une offre</li>
              <li>• Contrôler les stocks disponibles</li>
              <li>• Définir les périodes de vente</li>
            </ul>

            <div className="mt-auto flex flex-col gap-1 pt-2">
              <Link
                to="/admin/offres"
                className="text-xs text-pink-300 group-hover:text-pink-200 underline underline-offset-2"
              >
                Voir toutes les offres →
              </Link>
              <Link
                to="/admin/offres/nouveau"
                className="text-xs text-amber-300 group-hover:text-amber-200 underline underline-offset-2"
              >
                Créer une nouvelle offre →
              </Link>
            </div>
          </div>

          {/* CRUD / Stats / Commandes */}
          <div className="group rounded-xl border border-slate-700 bg-slate-900/80 p-4 flex flex-col gap-3 hover:border-pink-400/80 hover:bg-slate-900 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Statistiques & commandes
                </h3>
                <p className="text-xs text-slate-400">
                  Analyse des ventes et suivi des commandes clients.
                </p>
              </div>
              <span className="text-xl">📊</span>
            </div>

            <ul className="text-xs text-slate-300 space-y-1 mt-1">
              <li>• Visualiser les commandes et leur statut</li>
              <li>• Accéder aux statistiques détaillées</li>
            </ul>

            <div className="mt-auto flex flex-col gap-1 pt-2">
              <Link
                to="/admin/commandes"
                className="text-xs text-pink-300 group-hover:text-pink-200 underline underline-offset-2"
              >
                Suivi des commandes →
              </Link>
              <Link
                to="/admin/stats"
                className="text-xs text-emerald-300 group-hover:text-emerald-200 underline underline-offset-2"
              >
                Ouvrir les statistiques détaillées →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
