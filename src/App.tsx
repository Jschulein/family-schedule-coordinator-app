
import { useEffect } from 'react';
import './App.css';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { useFamilyContext } from './contexts/family';
import { EventProvider } from './contexts/EventContext';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  const { fetchFamilies } = useFamilyContext();

  // Initialize by fetching families once on app load
  useEffect(() => {
    fetchFamilies().catch(err => console.error("Error fetching initial family data:", err));
  }, [fetchFamilies]);

  return (
    <ThemeProvider>
      <AuthProvider>
        <EventProvider>
          <RouterProvider router={router} />
          <Toaster />
          <SonnerToaster />
        </EventProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
