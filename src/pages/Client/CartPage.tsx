import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Cart, CartLine } from "@/types/carts";
import {
  getActiveCart,
  increaseLine,
  decreaseLine,
  removeCartLine,
} from "@/api/carts.api";

function isCanceledError(err: any) {
  return err?.code === "ERR_CANCELED" || err?.name === "CanceledError";
}

function fmtMoney(v?: number | string) {
  if (v === undefined || v === null) return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export default function CartPage() {
  const navigate = useNavigate();

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const c = await getActiveCart();
      setCart(c);
    } catch (e: any) {
      if (isCanceledError(e)) return;
      setError("Impossible de charger votre panier.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const total = useMemo(() => {
    if (!cart) return 0;
    if (cart.montant_total !== undefined)
      return Number(cart.montant_total) || 0;
    return cart.lignes.reduce(
      (acc, l) => acc + (Number(l.sous_total) || 0),
      0
    );
  }, [cart]);

  async function onPlus(line: CartLine) {
    try {
      setBusyId(line.id);
      await increaseLine(line);
      await refresh();
    } catch {
      setError("Impossible d’augmenter la quantité.");
    } finally {
      setBusyId(null);
    }
  }

  async function onMinus(line: CartLine) {
    if (!cart) return;
    try {
      setBusyId(line.id);
      await decreaseLine(cart.id, line);
      await refresh();
    } catch {
      setError("Impossible de réduire la quantité.");
    } finally {
      setBusyId(null);
    }
  }

  async function onRemove(line: CartLine) {
    if (!cart) return;
    const ok = window.confirm("Retirer cette offre du panier ?");
    if (!ok) return;

    try {
      setBusyId(line.id);
      await removeCartLine(cart.id, line.id);
      await refresh();
    } catch {
      setError("Impossible de supprimer cette ligne.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <div className="cart-client__state">Chargement de votre panier…</div>;
  }

  return (
    <div className="cart-client">
      <h1 className="cart-client__title">🛒 Mon panier</h1>
      <p className="cart-client__subtitle">
        Vérifiez votre sélection avant de finaliser la réservation
      </p>

      {error && <div className="cart-client__error">{error}</div>}

      {!cart || cart.lignes.length === 0 ? (
        <div className="cart-client__empty">
          Votre panier est vide.  
          Sélectionnez une épreuve pour réserver vos billets.
        </div>
      ) : (
        <>
          <div className="cart-client__items">
            {cart.lignes.map((l) => {
              const isBusy = busyId === l.id;
              return (
                <div key={l.id} className="cart-client__item">
                  <div className="cart-client__info">
                    <div className="cart-client__item-title">
                      🎟 Offre #{l.offre}
                    </div>
                    <div className="cart-client__item-meta">
                      Prix unitaire :
                      <strong> {fmtMoney(l.prix_unitaire)}</strong>
                    </div>
                    <div className="cart-client__item-meta">
                      Sous‑total :
                      <strong> {fmtMoney(l.sous_total)}</strong>
                    </div>
                  </div>

                  <div className="cart-client__actions">
                    <button disabled={isBusy} onClick={() => onMinus(l)}>
                      −
                    </button>
                    <span className="cart-client__qty">{l.quantite}</span>
                    <button disabled={isBusy} onClick={() => onPlus(l)}>
                      +
                    </button>
                    <button
                      className="danger"
                      disabled={isBusy}
                      onClick={() => onRemove(l)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cart-client__summary">
            <div className="cart-client__total">
              Total de la réservation : {fmtMoney(total)}
            </div>

            <button
              className="cart-client__checkout"
              onClick={() => navigate("/mon-espace/checkout")}
            >
               Continuer vers le paiement
            </button>
          </div>
        </>
      )}
    </div>
  );
}
