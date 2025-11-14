// src/guards/PrivateRoute.tsx
import React, { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import  useAuth  from "@/hooks/useAuth";

type GuardProps = {
  children: ReactNode;
};

export default function PrivateRoute({ children }: GuardProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-6">Chargement…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
