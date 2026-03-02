// src/guards/AdminRoute.tsx
import React, { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "@/hooks/useAuth";

// Je garde un typage simple : un guard reçoit des children à protéger.
type GuardProps = { children: ReactNode };

// Je normalise les booléens car l'API peut renvoyer 0/1 au lieu de true/false.
function toBool(v: unknown): boolean {
  return v === true || v === 1 || v === "1";
}

// Je centralise la règle admin ici pour éviter les incohérences entre pages.
function isAdminUser(user: any): boolean {
  return (
    user?.type_compte === "ADMIN" ||
    toBool(user?.is_staff) ||
    toBool(user?.is_superuser)
  );
}

export default function AdminRoute({ children }: GuardProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Je bloque l'affichage tant que l'AuthProvider charge l'état de session.
  if (loading) {
    return (
      <div className="p-6">
        Chargement…
      </div>
    );
  }

  // Si aucun profil n'est disponible, je force la connexion.
  // Je conserve la route demandée pour revenir dessus après login.
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Si connecté mais pas admin, je renvoie vers l'accueil.
  // Objectif : empêcher l'accès aux pages d'administration.
  if (!isAdminUser(user)) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Admin OK : j'affiche le layout admin + la page enfant.
  return <>{children}</>;
}