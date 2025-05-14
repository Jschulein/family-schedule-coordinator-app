
import './App.css';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { EventProvider } from './contexts/EventContext';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';
import { FamilyProvider } from './contexts/family';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FamilyProvider>
          <EventProvider>
            <RouterProvider router={router} />
            <Toaster />
            <SonnerToaster />
          </EventProvider>
        </FamilyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
