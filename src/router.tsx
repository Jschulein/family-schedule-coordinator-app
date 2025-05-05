import {
  createBrowserRouter,
} from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Calendar from "./pages/Calendar";
import NotFound from "./pages/NotFound";
import Families from "./pages/Families";
import Events from "./pages/Events";
import EventEdit from "./pages/EventEdit";
import EventCreate from "./pages/EventCreate";
import TestingPage from "./pages/Testing";
import TestFamilyFlowPage from "./pages/TestFamilyFlow";

const router = createBrowserRouter([
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
        element: <Events />,
      },
      {
        path: "/events/:eventId/edit",
        element: <EventEdit />,
      },
      {
        path: "/event/create",
        element: <EventCreate />,
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
