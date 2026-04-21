//features/catalog/components/OffertCard.tsx
import React, { useState } from "react";
import type { Offer } from "@/types/offers";
import  Button  from "@/components/ui/Button";
import  Badge  from "@/components/ui/Badge";
import  Input  from "@/components/ui/Input";
import { formatPrice } from "@/utils/totals";


type Props = {
  offer: Offer;
  className?: string;
  onAddToCart?: (offerId: number, quantite: number) => Promise<void> | void;
  compact?: boolean; // si true, réduit l’UI
};

export default function OfferCard({ offer, className, onAddToCart, compact = false }: Props) {
  const [qty, setQty] = useState<number>(1);
  const outOfStock = (offer.stock_disponible ?? 0) <= 0;

  const handleAdd = async () => {
    if (!onAddToCart) return;
    const q = Math.max(1, Math.min(qty, offer.stock_disponible ?? 1));
    await onAddToCart(offer.id, q);
    setQty(1);
  };

  return (
    <div
      className={`card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition ${className ?? ""}`}
    >
      <div className={`card-body ${compact ? "gap-2 py-4" : "gap-3"}`}>
        <div className="flex items-start justify-between">
          <h3 className="card-title text-base sm:text-lg">{offer.nom_offre}</h3>
          <div className="flex items-center gap-2">
            <Badge>{offer.type_offre}</Badge>
            {offer.nb_personnes ? (
              <Badge variant="outline">{offer.nb_personnes} pers.</Badge>
            ) : null}
          </div>
        </div>

        {offer.description && !compact && (
          <p className="text-sm opacity-90 line-clamp-3">{offer.description}</p>
        )}

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-base sm:text-lg font-semibold">
            {formatPrice(Number(offer.prix ?? 0))}
          </div>
          <div className="text-sm opacity-75">
            Stock :{" "}
            {outOfStock ? (
              <span className="text-error font-medium">épuisé</span>
            ) : (
              <span className="font-medium">{offer.stock_disponible}</span>
            )}
          </div>
        </div>

        <div className="card-actions items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor={`qty-${offer.id}`} className="text-sm opacity-80">
              Qté
            </label>
            <Input
              id={`qty-${offer.id}`}
              type="number"
              min={1}
              max={offer.stock_disponible ?? 1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              className="w-20"
            />
          </div>

          <Button
            variant="primary"
            disabled={outOfStock || !onAddToCart}
            onClick={handleAdd}
            aria-label={`Ajouter ${offer.nom_offre} au panier`}
          >
            {outOfStock ? "Indisponible" : "Ajouter au panier"}
          </Button>
        </div>
      </div>
    </div>
  );
}
