import { useEffect, useState } from "react";
import { addToCart } from "@/api/carts.api";
import { listOffers } from "@/api/offers.api";
import type { Offer, Paginated } from "@/types/offers";
import { formatCurrency } from "@/utils/format";
import useToast from "@/hooks/useToast";

export default function OffersListPage() {
  const { showToast } = useToast();

  const [data, setData] = useState<Paginated<Offer> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);

  async function load(p: number = 1) {
    setLoading(true);
    try {
      const res = await listOffers({ page: p });
      setData(res);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(page);
  }, [page]);

  async function handleAdd(offer: Offer) {
    try {
      await addToCart(offer.id, 1);
      showToast(`Ajouté : ${offer.nom_offre}`, "success");
    } catch {
      showToast("Impossible d’ajouter au panier.", "error");
    }
  }

  const offers: Offer[] = data?.results ?? [];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">Offres</h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : offers.length === 0 ? (
        <div className="alert">
          <span>Aucune offre disponible.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {offers.map((o) => (
            <div key={o.id} className="card bg-base-100 shadow">
              <div className="card-body">
                <h2 className="card-title">{o.nom_offre}</h2>
                <p className="text-sm opacity-75 line-clamp-3">
                  {o.description}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-semibold">
                    {formatCurrency(Number(o.prix || 0))}
                  </span>
                  <span className="badge">
                    {o.stock_disponible ?? 0} dispo
                  </span>
                </div>
                <div className="card-actions justify-end mt-3">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleAdd(o)}
                    disabled={(o.stock_disponible ?? 0) <= 0}
                  >
                    Ajouter au panier
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center gap-2">
        <button
          className="btn btn-outline btn-sm"
          disabled={!data?.previous}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Précédent
        </button>
        <button
          className="btn btn-outline btn-sm"
          disabled={!data?.next}
          onClick={() => setPage((p) => p + 1)}
        >
          Suivant
        </button>
      </div>
    </div>
  );
}