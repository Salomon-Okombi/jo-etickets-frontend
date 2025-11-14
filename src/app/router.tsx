import { createBrowserRouter } from "react-router-dom";

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
import DashboardPage from "@/pages/Admin/DashboardPage";
import EventsAdminListPage from "@/pages/Admin/Events/EventsAdminList";
import EventAdminCreatePage from "@/pages/Admin/Events/EventAdminCreate";
import EventAdminEditPage from "@/pages/Admin/Events/EventAdminEdit";

import OffersAdminListPage from "@/pages/Admin/Offers/OffersAdminList";
import OfferAdminCreatePage from "@/pages/Admin/Offers/OfferAdminCreate";
import OfferAdminEditPage from "@/pages/Admin/Offers/OfferAdminEdit";

import StatsPage from "@/pages/Admin/Stats/StatsPage";
import UsersAdminListPage from "@/pages/Admin/Users/UsersAdminList";
import UserAdminDetailPage from "@/pages/Admin/Users/UserAdminDetail";

// 404
import NotFoundPage from "@/pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      // ========= ZONE PUBLIQUE =========
      {
        element: <PublicLayout />,
        children: [
          // Accueil
          { index: true, element: <HomePage /> },

          // Événements publics
          { path: "evenements", element: <EventsListPage /> },
          { path: "evenements/:id", element: <EventDetailPage /> },

          // Offres publiques (Solo / Duo / Famille)
          { path: "offres", element: <PublicOffersListPage /> },

          // Auth
          { path: "login", element: <LoginPage /> },
          { path: "register", element: <RegisterPage /> },
        ],
      },

      // ========= ZONE CLIENT (MON ESPACE) =========
      {
        path: "mon-espace",
        element: (
          <PrivateRoute>
            <ClientLayout />
          </PrivateRoute>
        ),
        children: [
          // Panier & paiement
          { path: "panier", element: <CartPage /> },
          { path: "checkout", element: <CheckoutPage /> },

          // Offres côté client (si tu veux un écran spécifique)
          { path: "offres", element: <ClientOffersListPage /> },

          // Commandes
          { path: "commandes", element: <OrdersListPage /> },
          { path: "commandes/:id", element: <OrderDetailPage /> },

          // Billets (e-tickets)
          { path: "billets", element: <TicketsListPage /> },
          { path: "billets/:id", element: <TicketDetailPage /> },
        ],
      },

      // ========= ZONE ADMIN =========
      {
        path: "admin",
        element: (
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        ),
        children: [
          // Dashboard
          { index: true, element: <DashboardPage /> },

          // Gestion événements
          { path: "evenements", element: <EventsAdminListPage /> },
          { path: "evenements/nouveau", element: <EventAdminCreatePage /> },
          { path: "evenements/:id", element: <EventAdminEditPage /> },

          // Gestion offres
          { path: "offres", element: <OffersAdminListPage /> },
          { path: "offres/nouvelle", element: <OfferAdminCreatePage /> },
          { path: "offres/:id", element: <OfferAdminEditPage /> },

          // Stats
          { path: "stats", element: <StatsPage /> },

          // Utilisateurs
          { path: "utilisateurs", element: <UsersAdminListPage /> },
          { path: "utilisateurs/:id", element: <UserAdminDetailPage /> },
        ],
      },

      // ========= 404 =========
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export default router;
