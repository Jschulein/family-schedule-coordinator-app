
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, ShieldAlert, Loader, LogOut } from "lucide-react";
import AddEventForm from "@/components/AddEventForm";
import { useEvents } from "@/contexts/EventContext";
import { useState, useEffect, useRef } from "react";
import { Event } from "@/types/eventTypes";
import { useFamilyContext } from "@/contexts/family";
import { logEventFlow } from "@/utils/events";
import { performanceTracker } from "@/utils/testing/performanceTracker";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useNewEventPage } from "@/hooks/events/useNewEventPage"; 
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * NewEvent page component
 * Handles the creation of new events and manages form submission state
 * With enhanced session readiness handling and auth error recovery
 */
const NewEvent = () => {
  // Get navigation and context hooks
  const navigate = useNavigate();
  const { activeFamilyId, families } = useFamilyContext();
  const perfMonitor = usePerformanceMonitor('NewEventPage');
  const { signOut } = useAuth();
  
  // Extract event handling to a custom hook
  const { 
    isSubmitting,
    isRefreshing, 
    error,
    isSessionReady,
    isCheckingSession,
    handleSubmit,
    handleReturn,
    handleRetry
  } = useNewEventPage();
  
  // Track if we've shown the auth warning
  const [hasShownRetryTip, setHasShownRetryTip] = useState(false);
  
  // Show auth retry tip if there's an RLS-related error
  useEffect(() => {
    if (error && 
        !hasShownRetryTip && 
        (error.includes("policy") || 
         error.includes("violates row-level security") || 
         error.includes("permission"))) {
      setHasShownRetryTip(true);
      toast({
        title: "Authentication Sync Issue",
        description: "Try refreshing the page, or if problems persist, log out and log back in.",
        duration: 8000
      });
    }
  }, [error, hasShownRetryTip]);

  // Function to handle logging out as a last resort
  const handleLogOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You've been signed out. Please sign in again to refresh your authentication.",
    });
    navigate("/auth");
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              className="mr-4" 
              onClick={handleReturn}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return
            </Button>
            <h1 className="text-4xl font-bold text-gray-900">
              Add New Event
            </h1>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRetry}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>
        
        {/* Authentication status indicator with loading state */}
        {isCheckingSession && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <Loader className="h-5 w-5 text-blue-600 mr-2 animate-spin" />
            <AlertTitle className="text-blue-800">Verifying authentication status...</AlertTitle>
            <AlertDescription className="text-blue-700">
              Please wait while we establish your authentication session.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Authentication warning - only shown after checking completes */}
        {!isSessionReady && !isCheckingSession && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-800">Authentication session not fully established</AlertTitle>
            <AlertDescription className="text-amber-700">
              <p className="mb-2">The system is still establishing your authentication session. Creating events may fail until this process completes.</p>
              <div className="flex gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
                  onClick={handleRetry}
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Retry
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
                  onClick={handleLogOut}
                >
                  <LogOut className="h-3 w-3 mr-1" /> Log Out & Back In
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {/* RLS error notice with recovery actions */}
        {error && error.includes("violates row-level security") && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertTitle className="text-red-800">Authentication Synchronization Error</AlertTitle>
            <AlertDescription>
              <p className="text-red-700 mb-2">
                There appears to be a synchronization issue between your login session and the database.
                This can happen right after signing in when the authentication hasn't fully propagated.
              </p>
              <div className="flex gap-2 mt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-red-100 text-red-800 border-red-300 hover:bg-red-200"
                  onClick={handleRetry}
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Retry
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-red-100 text-red-800 border-red-300 hover:bg-red-200"
                  onClick={handleLogOut}
                >
                  <LogOut className="h-3 w-3 mr-1" /> Log Out & Back In
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {!activeFamilyId && families.length > 0 && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <AlertTitle className="text-amber-800">Select a family</AlertTitle>
            <AlertDescription className="text-amber-700">
              Please select a family from the sidebar to share this event with family members.
            </AlertDescription>
          </Alert>
        )}
        
        {error && !error.includes("violates row-level security") && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <AddEventForm 
              onSubmit={handleSubmit} 
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewEvent;
