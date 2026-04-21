//router.tsx
import { createBrowserRouter, Navigate } from "react-router-dom";

// Layouts
import MainLayout from "@/layouts/MainLayout";
import PublicLayout from "@/layouts/PublicLayout";
import ClientLayout from "@/layouts/ClientLayout";
import AdminLayout from "@/layouts/AdminLayout";

// Guards
import PrivateRoute from "@/guards/PrivateRoute";
import AdminRoute from "@/guards/AdminRoute";

// Pages – Public
import HomePage from "@/pages/Public/HomePage";
import EventsListPage from "@/pages/Public/EventsListPage";
import EventDetailPage from "@/pages/Public/EventDetailPage";
import PublicOffersListPage from "@/pages/Public/OffersListPage";

// Pages – Auth
import LoginPage from "@/pages/Auth/LoginPage";
import RegisterPage from "@/pages/Auth/RegisterPage";

// Pages – Client (mon espace)
import CartPage from "@/pages/Client/CartPage";
import CheckoutPage from "@/pages/Client/CheckoutPage";
import ClientOffersListPage from "@/pages/Client/OffersListPage";
import OrdersListPage from "@/pages/Client/OrdersListPage";
import OrderDetailPage from "@/pages/Client/OrderDetailPage";
import TicketsListPage from "@/pages/Client/TicketsListPage";
import TicketDetailPage from "@/pages/Client/TicketDetailPage";




// Pages – Admin
import BilletAdminDetailPage from "@/pages/Admin/Billets/BilletAdminDetailPage";
import DashboardPage from "@/pages/Admin/DashboardPage";
import BilletAdminCreatePage from "@/pages/Admin/Billets/BilletAdminCreatePage";
import BilletAdminEditPage from "@/pages/Admin/Billets/BilletAdminEditPage";
import OrderAdminDetailPage from "@/pages/Admin/Orders/OrderAdminDetailPage";



import EventsAdminListPage from "@/pages/Admin/Events/EventsAdminList";
import EventAdminCreatePage from "@/pages/Admin/Events/EventAdminCreate";
import EventAdminEditPage from "@/pages/Admin/Events/EventAdminEdit";

import OffersAdminListPage from "@/pages/Admin/Offers/OffersAdminList";
import OfferAdminCreatePage from "@/pages/Admin/Offers/OfferAdminCreate";
import OfferAdminEditPage from "@/pages/Admin/Offers/OfferAdminEdit";

import StatsPage from "@/pages/Admin/Stats/StatsPage";
import UsersAdminListPage from "@/pages/Admin/Users/UsersAdminList";
import UserAdminDetailPage from "@/pages/Admin/Users/UserAdminDetail";
import UserAdminCreatePage from "@/pages/Admin/Users/UserAdminCreate";
// NOUVEAUX : Admin Billets + Admin Commandes
import BilletsAdminListPage from "@/pages/Admin/Billets/BilletsAdminListPage";
import OrdersAdminListPage from "@/pages/Admin/Orders/OrdersAdminListPage";


import PublicCartPage from "@/pages/Public/CartPage";
import CheckoutGatePage from "@/pages/Public/CheckoutGatePage";

// 404
import NotFoundPage from "@/pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      // ===================== ZONE PUBLIQUE =====================
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <HomePage /> },

          { path: "evenements", element: <EventsListPage /> },
          { path: "evenements/:id", element: <EventDetailPage /> },

          { path: "offres", element: <PublicOffersListPage /> },

          { path: "login", element: <LoginPage /> },
          { path: "register", element: <RegisterPage /> },

          { path: "panier", element: <PublicCartPage /> },
          { path: "checkout", element: <CheckoutGatePage /> },
        ],
      },

      // ===================== ZONE CLIENT (MON ESPACE) =====================
      {
        path: "mon-espace",
        element: (
          <PrivateRoute>
            <ClientLayout />
          </PrivateRoute>
        ),
        children: [
          // /mon-espace -> /mon-espace/commandes
          { index: true, element: <Navigate to="commandes" replace /> },

          { path: "panier", element: <CartPage /> },
          { path: "checkout", element: <CheckoutPage /> },

          { path: "offres", element: <ClientOffersListPage /> },

          { path: "commandes", element: <OrdersListPage /> },
          { path: "commandes/:id", element: <OrderDetailPage /> },

          { path: "billets", element: <TicketsListPage /> },
          { path: "billets/:id", element: <TicketDetailPage /> },

        

        ],
      },

      // ===================== ZONE ADMIN =====================
      {
        path: "admin",
        element: (
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        ),
        children: [
          // Dashboard par défaut
          { index: true, element: <DashboardPage /> },
          { path: "dashboard", element: <DashboardPage /> },

          // Commandes (Admin)
          { path: "commandes", element: <OrdersAdminListPage /> },
          // Alias pratique : /admin/orders -> /admin/commandes
          { path: "orders", element: <Navigate to="/admin/commandes" replace /> },
          { path: "commandes/:id", element: <OrderAdminDetailPage /> },

          // Billets / Tickets (Admin)
          { path: "billets", element: <BilletsAdminListPage /> },
          // Alias pratique : /admin/tickets -> /admin/billets
          { path: "tickets", element: <Navigate to="/admin/billets" replace /> },


          { path: "billets/nouveau", element: <BilletAdminCreatePage /> },
          { path: "billets/:id", element: <BilletAdminEditPage /> },

          // Events (Admin)
          { path: "evenements", element: <EventsAdminListPage /> },
          { path: "evenements/nouveau", element: <EventAdminCreatePage /> },
          { path: "evenements/:id", element: <EventAdminEditPage /> },

          // Offres (Admin)
          { path: "offres", element: <OffersAdminListPage /> },
          { path: "offres/nouvelle", element: <OfferAdminCreatePage /> },
          { path: "offres/:id", element: <OfferAdminEditPage /> },

          // Stats (Admin)
          { path: "stats", element: <StatsPage /> },

          // Users (Admin)
          { path: "utilisateurs", element: <UsersAdminListPage /> },
          { path: "utilisateurs/nouveau", element: <UserAdminCreatePage /> },
          { path: "utilisateurs/:id", element: <UserAdminDetailPage /> },

          { path: "billets", element: <BilletsAdminListPage /> },
          { path: "billets/:id", element: <BilletAdminDetailPage /> },
        ],
      },

      // ===================== Alias pratique =====================
      // /dashboard -> /admin
      { path: "dashboard", element: <Navigate to="/admin" replace /> },

      // ===================== 404 =====================
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export default router;