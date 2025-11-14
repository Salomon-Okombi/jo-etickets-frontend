//bouton Télécharger QR/PNG
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getOrder, payOrder, type Order } from "@/api/orders.api";
import { formatCurrency } from "@/utils/format";
import  useToast  from "@/hooks/useToast";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  async function load() {
    if (!orderId) return;
    setLoading(true);
    try {
      const data = await getOrder(orderId);
      setOrder(data);
    } catch {
      toast.error("Impossible de charger la commande.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  async function handlePay() {
    if (!order) return;
    setPaying(true);
    try {
      await payOrder(order.id, {
        methode_paiement: "MockPaiement",
        reference_paiement: `WEB-${Date.now()}`,
      });
      toast.success("Paiement validé, billets générés.");
      await load();
    } catch {
      toast.error("Le paiement a échoué.");
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <div className="alert">
          <span>Commande introuvable.</span>
        </div>
      </div>
    );
  }

  const isPaid = order.statut_paiement === "PAYE";
  const lines = order.panier_detail?.lignes ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">
          Commande #{order.numero_commande}
        </h1>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={load}>
            Actualiser
          </button>
          <Link className="btn" to="/orders">
            Mes commandes
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  {lines.map((l) => (
                    <tr key={l.id}>
                      <td>{l.offre_nom ?? `Offre #${l.offre}`}</td>
                      <td>{formatCurrency(Number(l.prix_unitaire ?? 0))}</td>
                      <td>{l.quantite}</td>
                      <td>{formatCurrency(Number(l.sous_total ?? 0))}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={3} className="text-right font-semibold">Total</td>
                    <td className="font-semibold">{formatCurrency(Number(order.montant_total ?? 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body space-y-3">
            <h2 className="card-title">Statut & Paiement</h2>
            <div className="stats shadow w-full">
              <div className="stat">
                <div className="stat-title">Statut paiement</div>
                <div className={`stat-value ${isPaid ? "text-success" : "text-warning"}`}>
                  {order.statut_paiement}
                </div>
                <div className="stat-desc">{order.methode_paiement ?? "—"}</div>
              </div>
            </div>

            {!isPaid ? (
              <button className="btn btn-primary w-full" onClick={handlePay} disabled={paying}>
                {paying ? <span className="loading loading-spinner loading-xs" /> : "Payer maintenant"}
              </button>
            ) : (
              <button className="btn w-full" onClick={() => navigate("/tickets")}>
                Voir mes billets
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
