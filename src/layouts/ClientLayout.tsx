//header client (panier, profil)
import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import useAuth from "@/hooks/useAuth";

export default function ClientLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* 🌐 Navbar */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          <NavLink to="/" className="text-xl font-semibold text-indigo-600">
            🎫 JO e-Ticket
          </NavLink>

          <nav className="space-x-4">
            <NavLink
              to="/events"
              className={({ isActive }) =>
                `text-gray-700 hover:text-indigo-600 ${isActive ? "font-semibold" : ""}`
              }
            >
              Événements
            </NavLink>
            <NavLink
              to="/offers"
              className={({ isActive }) =>
                `text-gray-700 hover:text-indigo-600 ${isActive ? "font-semibold" : ""}`
              }
            >
              Offres
            </NavLink>
            <NavLink
              to="/cart"
              className={({ isActive }) =>
                `text-gray-700 hover:text-indigo-600 ${isActive ? "font-semibold" : ""}`
              }
            >
              Panier
            </NavLink>
            <NavLink
              to="/orders"
              className={({ isActive }) =>
                `text-gray-700 hover:text-indigo-600 ${isActive ? "font-semibold" : ""}`
              }
            >
              Mes commandes
            </NavLink>
          </nav>

          {user ? (
            <button
              onClick={logout}
              className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
            >
              Déconnexion
            </button>
          ) : (
            <NavLink
              to="/login"
              className="bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700"
            >
              Connexion
            </NavLink>
          )}
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 bg-gray-50 p-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-3 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} JO e-Ticket — Tous droits réservés.
      </footer>
    </div>
  );
}
