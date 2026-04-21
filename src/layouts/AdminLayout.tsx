//src/layouts/AdminLayout.tsx
import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import useToast from "@/hooks/useToast";
import "@/styles/admin.css";

/*
  Layout Administration
  - Admin séparé du site public (pas de header/footer public)
  - Sidebar admin dédiée
  - Ajout des modules manquants : Commandes + Billets
*/

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  function handleLogout() {
    logout();
    showToast("Déconnexion réussie ", "success");
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `admin-nav__link ${isActive ? "admin-nav__link--active" : ""}`;

  return (
    <div className="admin-shell">
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar__brand">
            <span className="admin-sidebar__brand-badge">JO</span>
            <span>Administration</span>
          </div>

          <nav className="admin-nav">
            <NavLink to="/admin" end className={navClass}>
              Tableau de bord
            </NavLink>

            <NavLink to="/admin/commandes" className={navClass}>
              Commandes
            </NavLink>

            <NavLink to="/admin/billets" className={navClass}>
              Billets / Tickets
            </NavLink>

            <NavLink to="/admin/evenements" className={navClass}>
              Événements
            </NavLink>

            <NavLink to="/admin/offres" className={navClass}>
              Offres
            </NavLink>

            <NavLink to="/admin/stats" className={navClass}>
              Statistiques
            </NavLink>

            <NavLink to="/admin/utilisateurs" className={navClass}>
              Utilisateurs
            </NavLink>
          </nav>

          <div className="admin-sidebar__footer">
            <div>{user?.username || user?.email || "Utilisateur"}</div>

            <button className="admin-sidebar__logout" onClick={handleLogout}>
              Se déconnecter
            </button>
          </div>
        </aside>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
``