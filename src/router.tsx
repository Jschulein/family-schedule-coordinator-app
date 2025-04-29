
import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import NotFound from "./pages/NotFound";

// Use React.lazy for code splitting
const Index = lazy(() => import("./pages/Index"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Auth = lazy(() => import("./pages/Auth"));
const NewEvent = lazy(() => import("./pages/NewEvent"));
const EditEvent = lazy(() => import("./pages/EditEvent"));
const Families = lazy(() => import("./pages/Families"));
const Settings = lazy(() => import("./pages/Settings"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Index />,
      },
      {
        path: "calendar",
        element: <Calendar />,
      },
      {
        path: "events/new",
        element: <NewEvent />,
      },
      {
        path: "events/:id/edit",
        element: <EditEvent />,
      },
      {
        path: "families",
        element: <Families />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
    ],
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
