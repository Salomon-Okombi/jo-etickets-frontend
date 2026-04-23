import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/features/cart/useCart";

export default function NavCartButton() {
  const { count } = useCart();

  return (
    <Link
      to="/panier"
      className="main-header__cta main-header__cta--outline"
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <ShoppingCart size={18} />
      Panier

      {count > 0 ? (
        <span
          style={{
            position: "absolute",
            top: -6,
            right: -6,
            background: "linear-gradient(120deg, #ff3355, #ffb300)",
            color: "#0f172a",
            borderRadius: 999,
            padding: "2px 7px",
            fontSize: 12,
            fontWeight: 800,
            border: "1px solid rgba(15,23,42,0.12)",
          }}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}