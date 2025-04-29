import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { EventProvider } from "./contexts/EventContext";
import { Toaster } from "@/components/ui/toaster";
import { FamilyProvider } from "./contexts/FamilyContext";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<p>Loading...</p>}>
        <EventProvider>
          <FamilyProvider>
            <RouterProvider router={router} />
          </FamilyProvider>
        </EventProvider>
      </Suspense>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
