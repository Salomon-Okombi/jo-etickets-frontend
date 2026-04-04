import React from "react";
import { Navigate, Outlet, Link } from "react-router-dom";
import useAuth from "@/hooks/useAuth";

export default function ClientLayout() {
  const { user, loading, logout } = useAuth();

  // Attente du chargement de la session
  if (loading) {
    return <div className="p-6">Chargement…</div>;
  }

  // Non connecté → login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Sécurité : un admin n’a rien à faire ici
  if (user.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="client-layout">
      {/* Header */}
      <header className="client-header">
        <div className="client-header__brand">
          <Link to="/">JO e‑Tickets</Link>
        </div>

        <nav className="client-header__nav">
          <Link to="/evenements">Événements</Link>
          <Link to="/offres">Offres</Link>
          <Link to="/panier">Panier</Link>
          <Link to="/mon-espace/commandes">Mes commandes</Link>
          <Link to="/mon-espace/billets">Mes billets</Link>
        </nav>

        <div className="client-header__actions">
          <span className="client-header__user">
            {user.username}
          </span>
          <button onClick={logout}>
            Déconnexion
          </button>
        </div>
      </header>

      {/* Contenu */}
      <main className="client-content">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="client-footer">
        <p>
          © 2026 JO e‑Tickets – Projet pédagogique
        </p>
      </footer>
    </div>
  );
}
``