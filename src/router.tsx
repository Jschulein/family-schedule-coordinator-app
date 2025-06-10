import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  Link,
  createRoutesFromElements,
} from "react-router-dom";
import AppLayout from '@/components/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Families from '@/pages/Families';
import Events from '@/pages/Events';
import Calendar from '@/pages/Calendar';
import Settings from '@/pages/Settings';
import ErrorPage from '@/pages/ErrorPage';
import FamilyDetails from '@/pages/FamilyDetails';
import EventDetails from '@/pages/EventDetails';
import CreateEvent from '@/pages/CreateEvent';
import EditEvent from '@/pages/EditEvent';
import CreateFamily from '@/pages/CreateFamily';
import SecurityAudit from "@/pages/SecurityAudit";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route 
      path="/" 
      element={<AppLayout />} 
      errorElement={<ErrorPage />}
    >
      <Route index element={<Dashboard />} />
      <Route path="families" element={<Families />} />
      <Route path="families/create" element={<CreateFamily />} />
      <Route path="families/:familyId" element={<FamilyDetails />} />
      <Route path="events" element={<Events />} />
      <Route path="events/create" element={<CreateEvent />} />
      <Route path="events/:eventId" element={<EventDetails />} />
      <Route path="events/:eventId/edit" element={<EditEvent />} />
      <Route path="calendar" element={<Calendar />} />
      <Route path="settings" element={<Settings />} />
      <Route path="/security-audit" element={<SecurityAudit />} />
    </Route>
  )
);

function Router() {
  return <RouterProvider router={router} />;
}

export default Router;
