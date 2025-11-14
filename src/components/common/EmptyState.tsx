// src/components/common/EmptyState.tsx
import React from "react";
import { AlertCircle } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  icon = <AlertCircle className="h-10 w-10 text-slate-400" />,
  title = "Aucune donnée disponible",
  message = "Essayez d’ajouter du contenu ou de réessayer plus tard.",
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
        {title}
      </h3>
      {message && (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md">
          {message}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
