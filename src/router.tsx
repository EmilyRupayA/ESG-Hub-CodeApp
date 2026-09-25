/**
 * Rutas del ESG Hub.
 * ⚠️ Si tu router.tsx original usa otra función (createHashRouter, basename, etc.)
 *    conserva esa configuración y solo copia el arreglo `children`.
 */
import { createBrowserRouter } from "react-router-dom";
import Layout from "@/pages/_layout";
import HomePage from "@/pages/home";
import DashboardPage from "@/pages/dashboard";
import ProjectsPage from "@/pages/projects";
import MonthlyTrackingPage from "@/pages/monthly-tracking";
import AssistancePage from "@/pages/assistance";
import AdminPage from "@/pages/admin";
import NotFoundPage from "@/pages/not-found";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "monthly-tracking", element: <MonthlyTrackingPage /> },
      { path: "assistance", element: <AssistancePage /> },
      { path: "admin", element: <AdminPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
