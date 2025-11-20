// src/app/App.tsx
import React, { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import UIProvider from "./providers/UIProvider";
import AuthProvider from "./providers/AuthProvider";
import RealtimeProvider from "./providers/RealtimeProvider";

const App: React.FC = () => {
  return (
    <UIProvider>
      <AuthProvider>
        <RealtimeProvider>
          <Suspense fallback={<div className="p-6">Chargement…</div>}>
            <RouterProvider router={router} />
          </Suspense>
        </RealtimeProvider>
      </AuthProvider>
    </UIProvider>
  );
};

export default App;
