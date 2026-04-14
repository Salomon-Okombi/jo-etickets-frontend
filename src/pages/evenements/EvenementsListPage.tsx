//evenements/EvenementsListPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPublicEvenements } from "@/api/publicEvenements";
import type { PublicEvenementListItem } from "@/types/evenements";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

function Skeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border overflow-hidden bg-white">
          <div className="aspect-[16/9] bg-gray-100 animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-3 w-2/3 bg-gray-100 animate-pulse rounded" />
            <div className="h-5 w-full bg-gray-100 animate-pulse rounded" />
            <div className="h-4 w-1/3 bg-gray-100 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Card({ e }: { e: PublicEvenementListItem }) {
  return (
    <Link
      to={`/evenements/${e.slug}`}
      className="group rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition border"
    >
      <div className="aspect-[16/9] bg-gray-100 overflow-hidden">
        {e.image_url ? (
          <img
            src={e.image_url}
            alt={e.titre}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Aucune image
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="text-xs text-gray-500">
          {formatDate(e.date_debut)} • {e.lieu || "Lieu à confirmer"}
        </div>
        <h3 className="mt-1 font-semibold text-lg text-gray-900">
          {e.titre}
        </h3>

        <div className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
          Voir l’événement <span className="group-hover:translate-x-0.5 transition">→</span>
        </div>
      </div>
    </Link>
  );
}

export default function EvenementsListPage() {
  const [events, setEvents] = useState<PublicEvenementListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchPublicEvenements(ctrl.signal)
      .then(setEvents)
      .catch((e) => {
        if (e?.name === "CanceledError") return;
        setError("Impossible de charger les événements.");
      });
    return () => ctrl.abort();
  }, []);

  const content = useMemo(() => {
    if (error) return <div className="text-red-600">{error}</div>;
    if (!events) return <Skeleton />;
    if (events.length === 0) return <div>Aucun événement disponible.</div>;
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((e) => <Card key={e.id} e={e} />)}
      </div>
    );
  }, [events, error]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Événements</h1>
        <p className="text-gray-600 mt-1">Choisis un événement et réserve en quelques clics.</p>
      </div>
      {content}
    </div>
  );
}