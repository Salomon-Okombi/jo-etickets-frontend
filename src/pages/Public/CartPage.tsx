//src/pages/Public/CartPage.tsx
import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/features/cart/useCart";

function fmtMoney(v?: number | string) {
  if (v === undefined || v === null) return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export default function PublicCartPage() {
  const navigate = useNavigate();
  const { items, setQty, removeItem, count } = useCart();

  const total = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.prix) || 0) * (Number(it.quantite) || 0), 0),
    [items]
  );

  return (
    <div style={{ padding: "1.5rem", maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.5rem" }}>Votre panier</h1>
      <div style={{ opacity: 0.8, marginBottom: "1rem" }}>{count} article(s)</div>

      {items.length === 0 ? (
        <div>Panier vide. <Link to="/offres">Voir les offres</Link></div>
      ) : (
        <>
          <div style={{ display: "grid", gap: "0.8rem" }}>
            {items.map((it) => (
              <div key={it.offre} style={{ border: "1px solid rgba(15,23,42,0.12)", borderRadius: 14, padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 900 }}>{it.nom_offre ?? `Offre #${it.offre}`}</div>
                    <div style={{ opacity: 0.8, marginTop: 4 }}>
                      Prix: <strong>{fmtMoney(it.prix)}</strong> — Places: <strong>{it.nb_personnes ?? "—"}</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                    <button onClick={() => setQty(it.offre, Math.max(1, it.quantite - 1))}>−</button>
                    <div style={{ minWidth: 28, textAlign: "center", fontWeight: 800 }}>{it.quantite}</div>
                    <button onClick={() => setQty(it.offre, it.quantite + 1)}>+</button>
                    <button onClick={() => removeItem(it.offre)}>Supprimer</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ fontWeight: 900, fontSize: "1.1rem" }}>Total estimé : {fmtMoney(total)}</div>
            <button onClick={() => navigate("/checkout")} style={{ padding: "0.6rem 1rem" }}>
              Passer au paiement
            </button>
          </div>
        </>
      )}
    </div>
  );
}