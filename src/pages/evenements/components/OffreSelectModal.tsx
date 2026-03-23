import { useEffect, useMemo, useState } from "react";
import type { PublicOffre } from "@/types/evenements";
import { usePanier } from "@/store/panier";

export default function OffreSelectModal({
  open,
  onClose,
  offre,
  eventTitle,
}: {
  open: boolean;
  onClose: () => void;
  offre: PublicOffre | null;
  eventTitle: string;
}) {
  const { addItem, loading, error } = usePanier();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (open) setQty(1);
  }, [open]);

  const maxQty = useMemo(() => {
    if (!offre) return 1;
    return Math.max(1, Math.min(10, offre.restant || 1));
  }, [offre]);

  if (!open || !offre) return null;

  const submit = async () => {
    await addItem(offre.id, qty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-xl border p-6">
        <div className="text-sm text-gray-500">Réservation • {eventTitle}</div>
        <div className="mt-1 text-xl font-bold text-gray-900">{offre.nom}</div>

        {offre.description ? (
          <div className="mt-2 text-sm text-gray-600">{offre.description}</div>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-gray-600">Prix</div>
            <div className="text-lg font-bold text-gray-900">
              {Number(offre.prix).toFixed(2)} {offre.devise}
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-600">Quantité</div>
            <div className="mt-1 inline-flex items-center rounded-2xl border overflow-hidden">
              <button
                className="px-3 py-2 hover:bg-gray-50"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <div className="px-4 py-2 min-w-[56px] text-center font-semibold">{qty}</div>
              <button
                className="px-3 py-2 hover:bg-gray-50"
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
              >
                +
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Max {maxQty} (stock restant : {offre.restant})
            </div>
          </div>
        </div>

        {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            className="w-full px-4 py-3 rounded-2xl border font-semibold hover:bg-gray-50"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            className="w-full px-4 py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
            onClick={submit}
            disabled={loading}
          >
            {loading ? "Ajout..." : "Ajouter au panier"}
          </button>
        </div>
      </div>
    </div>
  );
}