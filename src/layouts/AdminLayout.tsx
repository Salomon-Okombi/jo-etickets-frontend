//sidebar admin + topbar
import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import useToast from "@/hooks/useToast";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  function handleLogout() {
    logout();
    showToast("Déconnexion réussie ✅", "success");
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* 🧭 Sidebar Admin */}
      <aside className="w-64 bg-gray-900 text-gray-100 flex flex-col">
        <div className="p-4 text-lg font-semibold border-b border-gray-700">
          🎟️ Admin Dashboard
        </div>

        <nav className="flex-1 p-3 space-y-2">
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md ${isActive ? "bg-gray-800" : "hover:bg-gray-800/50"}`
            }
          >
            Tableau de bord
          </NavLink>
          <NavLink
            to="/admin/events"
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md ${isActive ? "bg-gray-800" : "hover:bg-gray-800/50"}`
            }
          >
            Événements
          </NavLink>
          <NavLink
            to="/admin/offers"
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md ${isActive ? "bg-gray-800" : "hover:bg-gray-800/50"}`
            }
          >
            Offres
          </NavLink>
          <NavLink
            to="/admin/stats"
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md ${isActive ? "bg-gray-800" : "hover:bg-gray-800/50"}`
            }
          >
            Statistiques
          </NavLink>
          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md ${isActive ? "bg-gray-800" : "hover:bg-gray-800/50"}`
            }
          >
            Utilisateurs
          </NavLink>
        </nav>

        <div className="p-3 border-t border-gray-700 text-sm">
          <div className="mb-2">{user?.username}</div>
          <button
            onClick={handleLogout}
            className="w-full text-left text-red-400 hover:text-red-300"
          >
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* 🧩 Contenu principal */}
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
