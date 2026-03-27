import React, { useMemo, useState } from "react";
import type { CartLine as CartLineType } from "@/types/carts";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import ConfirmDialog from "@/components/common/ConfirmDialog";

type Props = {
  line: CartLineType;
  panierId: number;

  onIncrease?: (line: CartLineType) => Promise<void> | void;
  onDecrease?: (line: CartLineType) => Promise<void> | void;
  onRemove?: (line: CartLineType) => Promise<void> | void;

  disabled?: boolean;
  dense?: boolean;
};

export default function CartLine({
  line,
  panierId,
  onIncrease,
  onDecrease,
  onRemove,
  disabled = false,
  dense = false,
}: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [working, setWorking] = useState<null | "inc" | "dec" | "del">(null);

  const canDecrease = useMemo(() => Number(line.quantite) > 1, [line.quantite]);

  const priceUnit = useMemo(
    () => Number(line.prix_unitaire ?? 0),
    [line.prix_unitaire]
  );

  const subTotal = useMemo(
    () => Number(line.sous_total ?? priceUnit * line.quantite),
    [line.sous_total, priceUnit, line.quantite]
  );

  const handleIncrease = async () => {
    if (!onIncrease || disabled) return;
    try {
      setWorking("inc");
      await onIncrease(line);
    } finally {
      setWorking(null);
    }
  };

  const handleDecrease = async () => {
    if (!onDecrease || disabled || !canDecrease) return;
    try {
      setWorking("dec");
      await onDecrease(line);
    } finally {
      setWorking(null);
    }
  };

  const handleRemove = async () => {
    if (!onRemove || disabled) return;
    try {
      setWorking("del");
      await onRemove(line);
      setConfirmOpen(false);
    } finally {
      setWorking(null);
    }
  };

  return (
    <div
      className={`w-full rounded-2xl border border-base-300 bg-base-100 p-4 flex items-center gap-4 ${
        dense ? "py-3" : "py-4"
      }`}
      data-panier-id={panierId}
      data-ligne-id={line.id}
    >
      {/* Nom de l’offre */}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">
          Offre #{line.offre}
        </div>
        <div className="text-sm text-base-content/70">
          Prix unitaire&nbsp;: {priceUnit.toFixed(2)} €
        </div>
      </div>

      {/* Contrôles quantité */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size={dense ? "sm" : "md"}
          aria-label="Diminuer la quantité"
          onClick={handleDecrease}
          disabled={disabled || working !== null || !canDecrease}
        >
          {working === "dec" ? <Spinner size="sm" /> : "−"}
        </Button>

        <div className="px-3 py-1 rounded-md bg-base-200 min-w-10 text-center">
          {line.quantite}
        </div>

        <Button
          variant="ghost"
          size={dense ? "sm" : "md"}
          aria-label="Augmenter la quantité"
          onClick={handleIncrease}
          disabled={disabled || working !== null}
        >
          {working === "inc" ? <Spinner size="sm" /> : "+"}
        </Button>
      </div>

      {/* Sous-total */}
      <div className="w-28 text-right font-semibold tabular-nums">
        {subTotal.toFixed(2)} €
      </div>

      {/* Supprimer */}
      <div>
        <Button
          variant="outline"
          tone="danger"
          size={dense ? "sm" : "md"}
          onClick={() => setConfirmOpen(true)}
          disabled={disabled || working !== null}
        >
          {working === "del" ? <Spinner size="sm" /> : "Supprimer"}
        </Button>
      </div>

      {/* Confirmation */}
      <ConfirmDialog
        open={confirmOpen}
        title="Supprimer l’article"
        description={`Retirer l’offre #${line.offre} du panier ?`}
        confirmText="Supprimer"
        confirmTone="danger"
        cancelText="Annuler"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleRemove}
        busy={working === "del"}
      />
    </div>
  );
}