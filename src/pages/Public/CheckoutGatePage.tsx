import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { useCart } from "@/features/cart/useCart";

export default function CheckoutGatePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { syncToServer, syncing } = useCart();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      if (!isAuthenticated) {
        navigate("/login", { state: { from: "/checkout" }, replace: true });
        return;
      }
      try {
        await syncToServer();
        navigate("/mon-espace/checkout", { replace: true });
      } catch {
        setError("Impossible de synchroniser le panier.");
      }
    }
    run();
  }, [isAuthenticated]);

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ fontWeight: 900, fontSize: "1.2rem" }}>Préparation du paiement…</div>
      {syncing ? <div style={{ marginTop: 8, opacity: 0.8 }}>Synchronisation du panier…</div> : null}
      {error ? <div style={{ marginTop: 12, color: "#b42318" }}>{error}</div> : null}
    </div>
  );
}