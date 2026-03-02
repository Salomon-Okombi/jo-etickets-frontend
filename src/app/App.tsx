import React, { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import router from "@/app/router";
import UIProvider from "./providers/UIProvider";
import AuthProvider from "./providers/AuthProvider";
import RealtimeProvider from "./providers/RealtimeProvider";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <UIProvider>
        <RealtimeProvider>
          <Suspense fallback={<div className="p-6">Chargement…</div>}>
            <RouterProvider router={router} />
          </Suspense>
        </RealtimeProvider>
      </UIProvider>
    </AuthProvider>
  );
};

export default App;