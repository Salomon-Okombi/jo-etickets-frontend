//EvenementDetailPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchPublicEvenement } from "@/api/publicEvenements";
import type { PublicEvenementDetail, PublicOffre } from "@/types/evenements";
import OffreSelectModal from "@/pages/evenements/components/OffreSelectModal";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" });
}

function Skeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="rounded-3xl overflow-hidden border bg-white">
        <div className="aspect-[21/9] bg-gray-100 animate-pulse" />
        <div className="p-6 space-y-4">
          <div className="h-7 w-2/3 bg-gray-100 animate-pulse rounded" />
          <div className="h-4 w-1/2 bg-gray-100 animate-pulse rounded" />
          <div className="h-4 w-full bg-gray-100 animate-pulse rounded" />
          <div className="h-4 w-5/6 bg-gray-100 animate-pulse rounded" />
        </div>
      </div>
    </div>
  );
}

function OffreRow({ offre, onSelect }: { offre: PublicOffre; onSelect: () => void }) {
  const disabled = !offre.est_disponible;
  const badge = disabled
    ? (offre.restant === 0 ? "Épuisée" : "Indisponible")
    : (offre.restant <= 15 ? `Plus que ${offre.restant}` : "Disponible");

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-2xl border bg-white">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-gray-900">{offre.nom}</div>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              disabled ? "bg-gray-100 text-gray-600" : "bg-green-50 text-green-700"
            }`}
          >
            {badge}
          </span>
        </div>
        {offre.description ? (
          <div className="text-sm text-gray-600 mt-1">{offre.description}</div>
        ) : null}
      </div>

      <div className="flex items-center justify-between md:justify-end gap-4">
        <div className="text-lg font-bold text-gray-900">
          {Number(offre.prix).toFixed(2)} {offre.devise}
        </div>
        <button
          className={`px-4 py-2 rounded-xl font-medium transition border ${
            disabled
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
          onClick={onSelect}
          disabled={disabled}
        >
          Sélectionner
        </button>
      </div>
    </div>
  );
}

export default function EvenementDetailPage() {
  const { slug } = useParams();
  const [event, setEvent] = useState<PublicEvenementDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const offresRef = useRef<HTMLDivElement | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOffre, setSelectedOffre] = useState<PublicOffre | null>(null);

  useEffect(() => {
    if (!slug) return;
    const ctrl = new AbortController();
    setEvent(null);
    setError(null);

    fetchPublicEvenement(slug, ctrl.signal)
      .then(setEvent)
      .catch((e) => {
        if (e?.name === "CanceledError") return;
        setError("Impossible de charger l’événement.");
      });

    return () => ctrl.abort();
  }, [slug]);

  const scrollToOffres = () => {
    offresRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openOffre = (offre: PublicOffre) => {
    setSelectedOffre(offre);
    setModalOpen(true);
  };

  const content = useMemo(() => {
    if (error) return <div className="max-w-6xl mx-auto px-4 py-8 text-red-600">{error}</div>;
    if (!event) return <Skeleton />;

    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-3xl overflow-hidden border bg-white shadow-sm">
          <div className="aspect-[21/9] bg-gray-100 overflow-hidden relative">
            {event.image_url ? (
              <img src={event.image_url} alt={event.titre} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">Aucune image</div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-white text-3xl font-bold drop-shadow">{event.titre}</h1>
              <div className="text-white/90 mt-2 text-sm">
                {formatDate(event.date_debut)} • {event.lieu || "Lieu à confirmer"}
              </div>
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={scrollToOffres}
                  className="inline-flex justify-center px-5 py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                >
                  Réserver maintenant
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <div className="max-w-none">
                <h2 className="text-xl font-bold text-gray-900">Description</h2>
                <p className="mt-2 text-gray-700 whitespace-pre-line">
                  {event.description || "Aucune description pour le moment."}
                </p>

                <h3 className="mt-6 text-lg font-semibold text-gray-900">Informations pratiques</h3>
                <ul className="mt-2 text-gray-700 space-y-1">
                  <li><span className="font-semibold">Date :</span> {formatDate(event.date_debut)}</li>
                  <li><span className="font-semibold">Lieu :</span> {event.lieu || "À confirmer"}</li>
                </ul>
              </div>

              <div ref={offresRef} className="mt-10">
                <h2 className="text-2xl font-bold text-gray-900">Offres & Tarifs</h2>
                <p className="text-gray-600 mt-1">Sélectionne ton offre puis ajoute au panier.</p>

                <div className="mt-4 space-y-3">
                  {event.offres?.length ? (
                    event.offres.map((o) => (
                      <OffreRow key={o.id} offre={o} onSelect={() => openOffre(o)} />
                    ))
                  ) : (
                    <div className="p-4 rounded-2xl border bg-gray-50 text-gray-600">
                      Aucune offre disponible pour cet événement.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-6 space-y-4">
                <div className="rounded-2xl border bg-white p-4">
                  <div className="text-sm text-gray-600">Réservation</div>
                  <div className="text-lg font-bold text-gray-900 mt-1">Prêt à réserver ?</div>
                  <button
                    onClick={scrollToOffres}
                    className="mt-4 w-full px-4 py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                  >
                    Voir les offres
                  </button>
                  <div className="mt-3 text-xs text-gray-500">
                    Paiement sécurisé • Billet disponible après achat
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <OffreSelectModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          offre={selectedOffre}
          eventTitle={event.titre}
        />
      </div>
    );
  }, [event, error, modalOpen, selectedOffre]);

  return content;
}