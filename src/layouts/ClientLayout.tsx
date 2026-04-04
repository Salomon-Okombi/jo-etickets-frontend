/*//*import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "@/hooks/useAuth";

export default function ClientLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Attente de l'initialisation de la session
  if (loading) {
    return <div>Chargement…</div>;
  }

  // Non authentifié → retour login avec mémorisation de la route
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Un admin ne doit jamais rester dans l’espace client
  if (user.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  // Client autorisé → affichage de la page enfant
  return <Outlet />;
}
``*/