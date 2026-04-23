// src/guards/AdminRoute.tsx
import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "@/hooks/useAuth";

type GuardProps = { children: ReactNode };

// Normalisation des booléens (API peut renvoyer 0/1)
function toBool(v: unknown): boolean {
  return v === true || v === 1 || v === "1";
}

//  Règle ADMIN unique et cohérente avec le backend
function isAdminUser(user: any): boolean {
  return (
    user?.role === "ADMIN" ||           //  CHAMP RÉEL DJANGO
    toBool(user?.is_staff) ||
    toBool(user?.is_superuser)
  );
}

export default function AdminRoute({ children }: GuardProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // En attente de l’état de session
  if (loading) {
    return <div className="p-6">Chargement…</div>;
  }

  // Non connecté → login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Connecté mais pas admin → refus
  if (!isAdminUser(user)) {
    return <Navigate to="/" replace />;
  }

  //  ADMIN OK
  return <>{children}</>;
}