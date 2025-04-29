
import { Navigate, createBrowserRouter } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import Index from "@/pages/Index";
import Calendar from "@/pages/Calendar";
import NewEvent from "@/pages/NewEvent";
import EditEvent from "@/pages/EditEvent";
import NotFound from "@/pages/NotFound";
import Families from "@/pages/Families";
import Auth from "@/pages/Auth";
import Settings from "@/pages/Settings";
import TestFamilyFlow from "@/pages/TestFamilyFlow";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Index /> },
      { path: "calendar", element: <Calendar /> },
      { path: "events/new", element: <NewEvent /> },
      { path: "events/:eventId/edit", element: <EditEvent /> },
      { path: "families", element: <Families /> },
      { path: "settings", element: <Settings /> },
      { path: "test-family-flow", element: <TestFamilyFlow /> },
      { path: "*", element: <NotFound /> },
    ],
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/*",
    element: <Navigate to="/auth" replace />,
  },
]);
