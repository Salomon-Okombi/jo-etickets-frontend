import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/features/cart/useCart";
import { fmtMoneyFromCents } from "@/features/cart/money";

export default function PublicCartPage() {
  const navigate = useNavigate();

  
  const { items, setQty, removeItem } = useCart();

  const totalCents = useMemo(() => {
    return items.reduce(
      (acc, it) => acc + (it.prix_centimes ?? 0) * (it.quantite ?? 0),
      0
    );
  }, [items]);

  return (
    <div className="cart-page">
      <h1 className="cart-page__title">🛒 Votre sélection</h1>

      <div className="cart-page__count">
        Encore une étape avant de réserver vos billets
      </div>

      {items.length === 0 ? (
        <div className="cart-empty">
          <p style={{ marginBottom: "0.6rem" }}>
            Votre panier est vide pour le moment.
          </p>
          <p>
            Sélectionnez une épreuve et réservez vos billets en toute simplicité.
          </p>

          <Link to="/evenements">→ Voir les événements</Link>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {items.map((it) => (
              <div key={it.offre} className="cart-item">
                <div className="cart-item__info">
                  <div className="cart-item__title">
                    {it.nom_offre ?? `Offre #${it.offre}`}
                  </div>

                  <div className="cart-item__meta">
                    Prix unitaire :
                    <strong>
                      {" "}
                      {fmtMoneyFromCents(it.prix_centimes)}
                    </strong>{" "}
                    •{" "}
                    <strong>
                      {it.nb_personnes ?? "—"} places incluses
                    </strong>
                  </div>
                </div>

                <div className="cart-item__actions">
                  <button
                    className="cart-btn"
                    onClick={() =>
                      setQty(it.offre, Math.max(1, it.quantite - 1))
                    }
                    aria-label="Réduire la quantité"
                  >
                    −
                  </button>

                  <div className="cart-qty">{it.quantite}</div>

                  <button
                    className="cart-btn"
                    onClick={() =>
                      setQty(it.offre, it.quantite + 1)
                    }
                    aria-label="Augmenter la quantité"
                  >
                    +
                  </button>

                  <button
                    className="cart-btn cart-btn--danger"
                    onClick={() => removeItem(it.offre)}
                    aria-label="Supprimer cette offre"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="cart-total">
              Total à payer (billets inclus) :{" "}
              {fmtMoneyFromCents(totalCents)}
            </div>

            <button
              className="cart-submit"
              onClick={() => navigate("/checkout")}
            >
              Finaliser ma réservation
            </button>
          </div>
        </>
      )}
    </div>
  );
}
