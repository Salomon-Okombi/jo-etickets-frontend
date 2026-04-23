import { Outlet } from "react-router-dom";
import MainHeader from "./MainHeader";
import MainFooter from "./MainFooter";
import { CartProvider } from "@/features/cart/CartContext";

export default function MainLayout() {
  return (
    <CartProvider>
      <div className="min-h-dvh flex flex-col bg-base-100 text-base-content">
        <MainHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <MainFooter />
      </div>
    </CartProvider>
  );
}
