
import { useEffect } from 'react';
import './App.css';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { useFamilyContext } from './contexts/FamilyContext';
import { EventProvider } from './contexts/EventContext';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';

function App() {
  const { fetchFamilies } = useFamilyContext();

  // Initialize by fetching families once on app load
  useEffect(() => {
    fetchFamilies().catch(err => console.error("Error fetching initial family data:", err));
  }, [fetchFamilies]);

  return (
    <ThemeProvider>
      <EventProvider>
        <RouterProvider router={router} />
        <Toaster />
        <SonnerToaster />
      </EventProvider>
    </ThemeProvider>
  );
}

export default App;
