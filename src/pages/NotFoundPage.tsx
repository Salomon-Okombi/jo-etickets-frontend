// src/pages/NotFoundPage.tsx
import React from "react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-base-200 text-center px-4">
      <h1 className="text-7xl font-extrabold text-error mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">Page introuvable</h2>
      <p className="text-base-content/70 mb-6 max-w-md">
        Désolé, la page que vous recherchez n’existe pas ou a été déplacée.
      </p>

      <div className="flex gap-4">
        <Link to="/" className="btn btn-primary">
          Retour à l’accueil
        </Link>
        <Link to="/events" className="btn btn-outline">
          Voir les événements
        </Link>
      </div>
    </main>
  );
}
