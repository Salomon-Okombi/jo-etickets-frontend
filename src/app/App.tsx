//app/App.tsx
import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import router from "@/app/router";
import UIProvider from "./providers/UIProvider";
import AuthProvider from "./providers/AuthProvider";
import RealtimeProvider from "./providers/RealtimeProvider";
import { CartProvider } from "@/features/cart/CartContext"

const App: React.FC = () => {
  return (
    <AuthProvider>
      <UIProvider>
        <CartProvider>
          <RealtimeProvider>
            <Suspense fallback={<div className="p-6">Chargement…</div>}>
              <RouterProvider router={router} />
            </Suspense>
          </RealtimeProvider>
        </CartProvider>

      </UIProvider>
    </AuthProvider>
  );
};

export default App;