import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getOrder, payOrder, type Order } from "@/api/orders.api";
import { formatCurrency, formatDateTime } from "@/utils/format";
import useToast from "@/hooks/useToast";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

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
      showToast("Impossible de charger la commande.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
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
      showToast("Paiement validé, billets générés !", "success");
      await load();
    } catch {
      showToast("Le paiement a échoué.", "error");
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
      <div className="flex items-center justify-between flex-wrap gap-3">
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
                    <th>Prix unitaire</th>
                    <th>Quantité</th>
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
                    <td colSpan={3} className="text-right font-semibold">
                      Total
                    </td>
                    <td className="font-semibold">
                      {formatCurrency(Number(order.montant_total ?? 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body space-y-3">
            <h2 className="card-title">Paiement</h2>

            <div className="stats shadow w-full">
              <div className="stat">
                <div className="stat-title">Statut</div>
                <div
                  className={`stat-value ${
                    isPaid ? "text-success" : "text-warning"
                  }`}
                >
                  {order.statut_paiement}
                </div>
                <div className="stat-desc">
                  {order.methode_paiement ?? "—"}
                </div>
              </div>
            </div>

            <p className="text-sm opacity-70">
              Commande créée le{" "}
              {formatDateTime(order.date_commande ?? "")}
            </p>

            {!isPaid ? (
              <button
                className="btn btn-primary w-full"
                onClick={handlePay}
                disabled={paying}
              >
                {paying ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  "Payer maintenant"
                )}
              </button>
            ) : (
              <button
                className="btn w-full"
                onClick={() => navigate("/tickets")}
              >
                Voir mes billets
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
