// src/pages/Client/CheckoutPage.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useCart from "@/hooks/useCart";
import { createOrder, payOrder } from "@/api/orders.api";
import { formatCurrency } from "@/utils/format";
import useToast from "@/hooks/useToast";
import type { CartLine } from "@/api/carts.api";

export default function CheckoutPage() {
  const { cart, refresh } = useCart();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const total = useMemo(() => {
    if (!cart?.lignes) return 0;
    return (cart.lignes as CartLine[]).reduce(
      (sum: number, l: CartLine) => sum + Number(l.sous_total ?? 0),
      0
    );
  }, [cart]);

  async function handleCreateOrder() {
    if (!cart) return;
    setCreating(true);
    try {
      const order = await createOrder({ panier: cart.id });
      setOrderId(order.id);
      showToast(`Commande créée #${order.numero_commande}`, "success");
    } catch {
      showToast("Création de la commande impossible.", "error");
    } finally {
      setCreating(false);
      await refresh();
    }
  }

  async function handlePay() {
    if (!orderId) {
      showToast("Aucune commande à payer.", "warning");
      return;
    }
    setPaying(true);
    try {
      await payOrder(orderId, {
        methode_paiement: "MockPaiement",
        reference_paiement: `WEB-${Date.now()}`,
      });
      showToast("Paiement validé, billets générés.", "success");
      navigate("/tickets");
    } catch {
      showToast("Le paiement a échoué.", "error");
    } finally {
      setPaying(false);
    }
  }

  if (!cart || (cart.lignes?.length ?? 0) === 0) {
    return (
      <div className="p-6">
        <div className="alert">
          <span>Ton panier est vide. Ajoute des offres avant de passer au paiement.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">Paiement</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Récap panier */}
        <div className="lg:col-span-2 card bg-base-100 shadow">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Offre</th>
                    <th>PU</th>
                    <th>Qté</th>
                    <th>Sous-total</th>
                  </tr>
                </thead>
                <tbody>
                  {(cart.lignes as CartLine[]).map((l: CartLine) => (
                    <tr key={l.id}>
                      <td>{l.offre_nom ?? `Offre #${l.offre}`}</td>
                      <td>{formatCurrency(Number(l.prix_unitaire ?? 0))}</td>
                      <td>{l.quantite}</td>
                      <td>{formatCurrency(Number(l.sous_total ?? 0))}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={3} className="text-right font-semibold">Total</td>
                    <td className="font-semibold">{formatCurrency(total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Actions paiement */}
        <div className="card bg-base-100 shadow">
          <div className="card-body space-y-3">
            <h2 className="card-title">Finaliser</h2>
            <p className="text-sm opacity-70">
              Le paiement génère automatiquement tes e-billets (QR codes).
            </p>

            <button
              className="btn btn-outline w-full"
              onClick={handleCreateOrder}
              disabled={creating || !!orderId}
            >
              {creating ? <span className="loading loading-spinner loading-xs" /> : "Créer la commande"}
            </button>

            <button
              className="btn btn-primary w-full"
              onClick={handlePay}
              disabled={paying || !orderId}
            >
              {paying ? <span className="loading loading-spinner loading-xs" /> : "Payer maintenant"}
            </button>

            {!!orderId && (
              <div className="alert alert-success mt-2">
                <span>Commande prête (# {orderId}). Tu peux procéder au paiement.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
