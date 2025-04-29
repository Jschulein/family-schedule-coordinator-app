
import { lazy, Suspense } from "react";
import { createBrowserRouter, Outlet } from "react-router-dom";
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

// Loading fallback component
const SuspenseFallback = () => <div className="flex items-center justify-center min-h-[70vh]">
  <div className="animate-pulse text-center">
    <p className="text-lg text-muted-foreground">Loading...</p>
  </div>
</div>;

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout><Outlet /></AppLayout>,
    children: [
      {
        index: true,
        element: <Suspense fallback={<SuspenseFallback />}><Index /></Suspense>,
      },
      {
        path: "calendar",
        element: <Suspense fallback={<SuspenseFallback />}><Calendar /></Suspense>,
      },
      {
        path: "events/new",
        element: <Suspense fallback={<SuspenseFallback />}><NewEvent /></Suspense>,
      },
      {
        path: "events/:id/edit",
        element: <Suspense fallback={<SuspenseFallback />}><EditEvent /></Suspense>,
      },
      {
        path: "families",
        element: <Suspense fallback={<SuspenseFallback />}><Families /></Suspense>,
      },
      {
        path: "settings",
        element: <Suspense fallback={<SuspenseFallback />}><Settings /></Suspense>,
      },
    ],
  },
  {
    path: "/auth",
    element: <Suspense fallback={<SuspenseFallback />}><Auth /></Suspense>,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
