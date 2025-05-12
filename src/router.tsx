
import {
  createBrowserRouter,
} from "react-router-dom";
import AppLayout from "./components/AppLayout"; 
import Calendar from "./pages/Calendar";
import NotFound from "./pages/NotFound";
import Families from "./pages/Families";
import NewEvent from "./pages/NewEvent"; 
import EditEvent from "./pages/EditEvent"; 
import TestingPage from "./pages/Testing";
import TestFamilyFlowPage from "./pages/TestFamilyFlow";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Events from "./pages/Events";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/ProtectedRoute";

// Export as a default export to match how it's imported in App.tsx
const router = createBrowserRouter([
  {
    path: "/auth",
    element: <Auth />,
    errorElement: <NotFound />
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Index />,
      },
      {
        path: "/calendar",
        element: <Calendar />,
      },
      {
        path: "/families",
        element: <Families />,
      },
      {
        path: "/events",
        element: <Events />,
      },
      {
        path: "/events/new",
        element: <NewEvent />,
      },
      {
        path: "/events/:eventId/edit",
        element: <EditEvent />,
      },
      {
        path: "/event/create",
        element: <NewEvent />,
      },
      {
        path: "/settings",
        element: <Settings />,
      },
      // Add testing routes
      {
        path: "/testing",
        element: <TestingPage />
      },
      {
        path: "/test-family-flow",
        element: <TestFamilyFlowPage />
      }
    ]
  }
]);

export default router;
