// src/pages/Client/CartPage.tsx (ou chemin équivalent)
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useCart from "@/hooks/useCart";
import { deleteCartLine, type CartLine } from "@/api/carts.api";
import { formatCurrency } from "@/utils/format";
import useToast from "@/hooks/useToast";

export default function CartPage() {
  const { cart, refresh } = useCart();
  const [removing, setRemoving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  async function handleRemoveLine(ligneId: number) {
    if (!cart) return;
    try {
      setRemoving(true);
      await deleteCartLine(cart.id, ligneId);
      toast.success("Ligne supprimée.");
      await refresh();
    } catch {
      toast.error("Suppression impossible.");
    } finally {
      setRemoving(false);
    }
  }

  const hasLines = (cart?.lignes?.length ?? 0) > 0;

  const total = cart
    ? (cart.lignes as CartLine[]).reduce(
        (s: number, l: CartLine) => s + Number(l.sous_total ?? 0),
        0
      )
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Mon panier</h1>
        <div className="flex gap-2">
          <button
            className="btn btn-outline"
            onClick={() => refresh()}
            disabled={!cart}
          >
            Actualiser
          </button>
          <Link className="btn" to="/offers">
            Poursuivre les achats
          </Link>
        </div>
      </div>

      {!cart ? (
        <div className="alert">
          <span>Pas de panier actif. Ajoute d’abord une offre.</span>
        </div>
      ) : !hasLines ? (
        <div className="alert">
          <span>Ton panier est vide.</span>
        </div>
      ) : (
        <div className="card bg-base-100 shadow">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Offre</th>
                    <th>Prix unitaire</th>
                    <th>Quantité</th>
                    <th>Sous-total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(cart.lignes as CartLine[]).map((l: CartLine) => (
                    <tr key={l.id}>
                      <td>{l.offre_nom ?? `Offre #${l.offre}`}</td>
                      <td>{formatCurrency(Number(l.prix_unitaire ?? 0))}</td>
                      <td>{l.quantite}</td>
                      <td>{formatCurrency(Number(l.sous_total ?? 0))}</td>
                      <td className="text-right">
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleRemoveLine(l.id)}
                          disabled={removing}
                        >
                          {removing ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : (
                            "Supprimer"
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={3} className="text-right font-semibold">
                      Total
                    </td>
                    <td className="font-semibold">
                      {formatCurrency(total)}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          className="btn btn-primary"
          onClick={() => navigate("/checkout")}
          disabled={!hasLines}
        >
          Passer au paiement
        </button>
      </div>
    </div>
  );
}
