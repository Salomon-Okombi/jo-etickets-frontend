import { createBrowserRouter, Navigate } from "react-router-dom";

// Layouts
import HomePage from "@/pages/Public/HomePage";
import MainLayout from "@/layouts/MainLayout";
import EventsListPage from "@/pages/Public/EventsListPage";
import EventDetailPage from "@/pages/Public/EventDetailPage";
import PublicOffersListPage from "@/pages/Public/OffersListPage";
import PublicCartPage from "@/pages/Public/CartPage";
import CheckoutGatePage from "@/pages/Public/CheckoutGatePage";

// Pages – Auth
import LoginPage from "@/pages/Auth/LoginPage";
import RegisterPage from "@/pages/Auth/RegisterPage";

// Pages – Client
import ClientCartPage from "@/pages/Client/CartPage";
import CheckoutPage from "@/pages/Client/CheckoutPage";
import ClientOffersListPage from "@/pages/Client/OffersListPage";
import OrdersListPage from "@/pages/Client/OrdersListPage";
import OrderDetailPage from "@/pages/Client/OrderDetailPage";
import TicketsListPage from "@/pages/Client/TicketsListPage";
import TicketDetailPage from "@/pages/Client/TicketDetailPage";
import ProfilePage from "@/pages/Client/ProfilePage";

// Pages – Admin
import DashboardPage from "@/pages/Admin/DashboardPage";

import OrdersAdminListPage from "@/pages/Admin/Orders/OrdersAdminListPage";
import OrderAdminDetailPage from "@/pages/Admin/Orders/OrderAdminDetailPage";

import BilletsAdminListPage from "@/pages/Admin/Billets/BilletsAdminListPage";
import BilletAdminCreatePage from "@/pages/Admin/Billets/BilletAdminCreatePage";
import BilletAdminEditPage from "@/pages/Admin/Billets/BilletAdminEditPage";
import BilletAdminDetailPage from "@/pages/Admin/Billets/BilletAdminDetailPage";

import EventsAdminListPage from "@/pages/Admin/Events/EventsAdminList";
import EventAdminCreatePage from "@/pages/Admin/Events/EventAdminCreate";
import EventAdminEditPage from "@/pages/Admin/Events/EventAdminEdit";

import OffersAdminListPage from "@/pages/Admin/Offers/OffersAdminList";
import OfferAdminCreatePage from "@/pages/Admin/Offers/OfferAdminCreate";
import OfferAdminEditPage from "@/pages/Admin/Offers/OfferAdminEdit";

import OfferCategoriesAdminListPage from "@/pages/Admin/OfferCategories/OfferCategoriesAdminList";
import OfferCategoryAdminCreatePage from "@/pages/Admin/OfferCategories/OfferCategoryAdminCreate";
import OfferCategoryAdminEditPage from "@/pages/Admin/OfferCategories/OfferCategoryAdminEdit";

import StatsPage from "@/pages/Admin/Stats/StatsPage";

import UsersAdminListPage from "@/pages/Admin/Users/UsersAdminList";
import UserAdminDetailPage from "@/pages/Admin/Users/UserAdminDetail";
import UserAdminCreatePage from "@/pages/Admin/Users/UserAdminCreate";

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

          { path: "panier", element: <PublicCartPage /> },
          { path: "checkout", element: <CheckoutGatePage /> },

          { path: "login", element: <LoginPage /> },
          { path: "register", element: <RegisterPage /> },
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
          { index: true, element: <Navigate to="commandes" replace /> },

          { path: "profil", element: <ProfilePage /> },

          { path: "panier", element: <ClientCartPage /> },
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
          // Dashboard
          { index: true, element: <DashboardPage /> },
          { path: "dashboard", element: <DashboardPage /> },

          // Commandes
          { path: "commandes", element: <OrdersAdminListPage /> },
          { path: "commandes/:id", element: <OrderAdminDetailPage /> },

          // Billets
          { path: "billets", element: <BilletsAdminListPage /> },
          { path: "billets/nouveau", element: <BilletAdminCreatePage /> },
          { path: "billets/:id/edit", element: <BilletAdminEditPage /> },
          { path: "billets/:id", element: <BilletAdminDetailPage /> },

          // Événements
          { path: "evenements", element: <EventsAdminListPage /> },
          { path: "evenements/nouveau", element: <EventAdminCreatePage /> },
          { path: "evenements/:id", element: <EventAdminEditPage /> },

          // Offres
          { path: "offres", element: <OffersAdminListPage /> },
          { path: "offres/nouvelle", element: <OfferAdminCreatePage /> },
          { path: "offres/:id", element: <OfferAdminEditPage /> },

          // Catégories d'offres (NOUVEAU)
          { path: "offres/categories", element: <OfferCategoriesAdminListPage /> },
          { path: "offres/categories/nouvelle", element: <OfferCategoryAdminCreatePage /> },
          { path: "offres/categories/:id", element: <OfferCategoryAdminEditPage /> },

          // Stats
          { path: "stats", element: <StatsPage /> },

          // Utilisateurs
          { path: "utilisateurs", element: <UsersAdminListPage /> },
          { path: "utilisateurs/nouveau", element: <UserAdminCreatePage /> },
          { path: "utilisateurs/:id", element: <UserAdminDetailPage /> },
        ],
      },

      // Alias pratique
      { path: "dashboard", element: <Navigate to="/admin" replace /> },

      // 404
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export default router;
import PublicLayout from "@/layouts/PublicLayout";
import ClientLayout from "@/layouts/ClientLayout";
import AdminLayout from "@/layouts/AdminLayout";

// Guards
import PrivateRoute from "@/guards/PrivateRoute";
import AdminRoute from "@/guards/AdminRoute";

// Pages – Public
