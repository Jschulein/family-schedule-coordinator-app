
import {
  createBrowserRouter,
} from "react-router-dom";
import AppLayout from "./components/AppLayout"; // Fixed path
import Calendar from "./pages/Calendar";
import NotFound from "./pages/NotFound";
import Families from "./pages/Families";
import NewEvent from "./pages/NewEvent"; // Using existing page
import EditEvent from "./pages/EditEvent"; // Using existing page
import TestingPage from "./pages/Testing";
import TestFamilyFlowPage from "./pages/TestFamilyFlow";

// Export as a named export to match how it's imported in App.tsx
export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Calendar />,
      },
      {
        path: "/families",
        element: <Families />,
      },
      {
        path: "/events",
        element: <Calendar />, // Temporarily point to Calendar
      },
      {
        path: "/events/:eventId/edit",
        element: <EditEvent />,
      },
      {
        path: "/event/create",
        element: <NewEvent />,
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
