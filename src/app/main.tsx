import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import router from "./router"; 


import AuthProvider from "@/app/providers/AuthProvider";
import UIProvider from "@/app/providers/UIProvider";
import RealtimeProvider from "@/app/providers/RealtimeProvider";

import "@/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <UIProvider>
        <RealtimeProvider>
          <RouterProvider router={router} />
        </RealtimeProvider>
      </UIProvider>
    </AuthProvider>
  </React.StrictMode>
);