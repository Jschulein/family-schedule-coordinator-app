
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, AlertTriangle, Info, Bug } from "lucide-react";
import AddEventForm from "@/components/AddEventForm";
import { useEvents } from "@/contexts/EventContext";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/types/eventTypes";
import { useFamilyContext } from "@/contexts/family";
import { testEventCreation } from "@/tests/eventFlow";
import { logEventFlow } from "@/utils/events";

interface EventFormData {
  name: string;
  date: Date;
  end_date?: Date;
  time: string;
  description: string;
  creatorId: string;
  familyMembers: string[];
  all_day: boolean;
}

const NewEvent = () => {
  const navigate = useNavigate();
  const { addEvent, loading: contextLoading, error: contextError, refetchEvents } = useEvents();
  const { activeFamilyId, families } = useFamilyContext();
  
  // Refs to track component lifecycle
  const mountedRef = useRef(true);
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Separate state for different loading scenarios
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  
  // Auth and error states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionAttempted, setSubmissionAttempted] = useState(false);
  
  // Log component mount and initial state
  useEffect(() => {
    logEventFlow('NewEvent', 'Component mounted', { 
      contextLoading,
      activeFamilyId
    });
    
    // Clear any stale submission state on mount
    setIsSubmitting(false);
    
    // Track component lifecycle
    return () => {
      mountedRef.current = false;
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
      logEventFlow('NewEvent', 'Component unmounting');
    };
  }, []);
  
  // Reset form state after a timeout if submission gets stuck
  useEffect(() => {
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
      submitTimeoutRef.current = null;
    }
    
    if (isSubmitting) {
      logEventFlow('NewEvent', 'Setting up submission watchdog timer');
      // Auto-reset submission state after 20 seconds to prevent UI from being stuck
      submitTimeoutRef.current = setTimeout(() => {
        if (isSubmitting && mountedRef.current) {
          logEventFlow('NewEvent', 'WATCHDOG: Event submission is taking too long - resetting submission state');
          setIsSubmitting(false);
          toast({
            title: "Submission timeout",
            description: "The request is taking longer than expected. You can try the diagnostics tool to check for issues.",
            variant: "default"
          });
        }
      }, 15000);
      
      // Add an additional shorter timeout as a double-check
      const shortTimeoutId = setTimeout(() => {
        if (isSubmitting && mountedRef.current) {
          logEventFlow('NewEvent', 'Mid-point submission state check - still submitting');
        }
      }, 7500);
      
      return () => {
        clearTimeout(shortTimeoutId);
      };
    }
  }, [isSubmitting]);

  // Check authentication on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        logEventFlow('NewEvent', 'Checking authentication');
        setIsChecking(true);
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          logEventFlow('NewEvent', 'Auth error', error);
          toast({
            title: "Authentication error",
            description: "Please try logging in again",
            variant: "destructive"
          });
          navigate("/auth");
          return;
        }
        
        const hasSession = !!data.session;
        logEventFlow('NewEvent', 'Authentication check complete', { hasSession });
        setIsAuthenticated(hasSession);
        
        if (!hasSession) {
          toast({
            title: "Authentication required",
            description: "You need to be logged in to create events",
            variant: "destructive"
          });
          navigate("/auth");
        }
      } catch (err) {
        logEventFlow('NewEvent', 'Error checking auth', err);
        toast({
          title: "Error",
          description: "Failed to verify authentication status",
          variant: "destructive"
        });
      } finally {
        if (mountedRef.current) {
          setIsChecking(false);
        }
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  // Show family selection reminder if needed
  useEffect(() => {
    if (!isChecking && families.length > 0 && !activeFamilyId && !submissionAttempted) {
      logEventFlow('NewEvent', 'Family selection reminder displayed', {
        familiesCount: families.length,
        activeFamilyId
      });
      
      toast({
        title: "Family selection needed",
        description: "Please select a family to share this event with",
        variant: "default"
      });
    }
  }, [families, activeFamilyId, isChecking, submissionAttempted]);

  const handleSubmit = async (eventData: EventFormData) => {
    logEventFlow('NewEvent', 'Starting event submission process', { 
      name: eventData.name,
      formSubmitting: isSubmitting
    });
    
    if (isSubmitting) {
      logEventFlow('NewEvent', 'Preventing duplicate submission - already in progress');
      return;
    }
    
    setSubmissionAttempted(true);
    setIsSubmitting(true);
    setError(null);
    setDiagnosticResult(null);
    
    // Wrap everything in a try-catch to ensure we reset loading state no matter what
    try {
      logEventFlow('NewEvent', 'Form submission data received', eventData);
      
      // Verify authentication again before submitting
      const { data, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        logEventFlow('NewEvent', 'Auth error during submission', authError);
        toast({
          title: "Authentication error",
          description: "Please try logging in again",
          variant: "destructive"
        });
        navigate("/auth");
        return;
      }
      
      if (!data.session) {
        logEventFlow('NewEvent', 'No session found during submission');
        toast({
          title: "Authentication required",
          description: "You need to be logged in to create events",
          variant: "destructive"
        });
        navigate("/auth");
        return;
      }
      
      // Prepare the event data
      const event: Event = {
        name: eventData.name,
        date: eventData.date,
        end_date: eventData.end_date || eventData.date,
        time: eventData.time,
        description: eventData.description,
        creatorId: data.session.user.id,
        familyMembers: eventData.familyMembers,
        all_day: eventData.all_day
      };
      
      logEventFlow('NewEvent', 'Processed event data for submission', event);
      
      try {
        // Add the event
        logEventFlow('NewEvent', 'Calling addEvent function from context');
        const createdEvent = await addEvent(event);
        
        logEventFlow('NewEvent', 'Event creation result received', { 
          success: !!createdEvent,
          eventId: createdEvent?.id
        });
        
        if (createdEvent) {
          toast({
            title: "Success",
            description: "Event created successfully!",
            variant: "default"
          });
          navigate("/calendar");
        } else {
          logEventFlow('NewEvent', 'No event returned from addEvent - possible issue');
          setError("Event creation may not have completed successfully. Please check the calendar or try the diagnostic tool.");
          toast({
            title: "Warning",
            description: "The event may not have been created properly. Try the diagnostic tool below.",
            variant: "default"
          });
        }
      } catch (error: any) {
        logEventFlow('NewEvent', 'Error during addEvent execution', error);
        setError(error?.message || "Failed to create event");
        toast({
          title: "Error",
          description: `Failed to create event: ${error?.message || "Unknown error"}`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      logEventFlow('NewEvent', 'Critical error in handleSubmit', error);
      setError(error?.message || "Failed to create event");
      toast({
        title: "Error",
        description: `Failed to create event: ${error?.message || "Unknown error"}`,
        variant: "destructive"
      });
    } finally {
      // Make absolutely sure we reset the submitting state if component is still mounted
      if (mountedRef.current) {
        logEventFlow('NewEvent', 'Resetting submission state');
        setIsSubmitting(false);
      }
    }
  };

  const handleReturn = () => {
    navigate("/");
  };
  
  const handleRetry = async () => {
    setIsRefreshing(true);
    setError(null);
    logEventFlow('NewEvent', 'Manual data refresh requested');
    
    try {
      await refetchEvents(true);
      toast({
        title: "Success",
        description: "Data refreshed successfully",
        variant: "default"
      });
    } catch (error: any) {
      logEventFlow('NewEvent', 'Error refreshing data', error);
      setError(error?.message || "Failed to refresh data");
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive"
      });
    } finally {
      if (mountedRef.current) {
        setIsRefreshing(false);
      }
    }
  };
  
  const runDiagnosticTest = async () => {
    setIsDiagnosing(true);
    setError(null);
    logEventFlow('NewEvent', 'Running diagnostic test');
    
    try {
      const result = await testEventCreation();
      logEventFlow('NewEvent', 'Diagnostic test result', { result });
      
      if (mountedRef.current) {
        setDiagnosticResult({
          success: result,
          message: result 
            ? "Event creation test was successful!" 
            : "Event creation test failed. Check console for details.",
          event: null
        });
      }
      
      if (result) {
        toast({
          title: "Diagnostic Success",
          description: "Event creation test was successful!",
          variant: "default"
        });
      } else {
        toast({
          title: "Diagnostic Failed",
          description: "Event creation test failed. See details below.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      logEventFlow('NewEvent', 'Error running diagnostics', error);
      toast({
        title: "Diagnostic Error",
        description: error?.message || "Failed to run diagnostic",
        variant: "destructive"
      });
    } finally {
      if (mountedRef.current) {
        setIsDiagnosing(false);
      }
    }
  };

  if (isChecking) {
    return <div className="p-8 text-center">Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    return <div className="p-8 text-center">Please log in to create events.</div>;
  }

  logEventFlow('NewEvent', 'Rendering component', {
    isSubmitting,
    contextLoading,
    hasError: !!error || !!contextError
  });

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
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={runDiagnosticTest}
              disabled={isDiagnosing}
            >
              <Bug className={`mr-2 h-4 w-4 ${isDiagnosing ? "animate-pulse" : ""}`} />
              {isDiagnosing ? "Diagnosing..." : "Run Diagnostic"}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRetry}
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
          </div>
        </div>
        
        {!activeFamilyId && families.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6 flex items-start">
            <Info className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800">Select a family</p>
              <p className="text-sm text-amber-700">
                Please select a family from the sidebar to share this event with family members.
              </p>
            </div>
          </div>
        )}
        
        {(contextError || error) && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Error: {contextError || error}. Please try refreshing the data or run the diagnostic tool.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {diagnosticResult && (
          <div className={`mb-6 p-4 border rounded-md ${
            diagnosticResult.success ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
          }`}>
            <h3 className="font-medium mb-2">Diagnostic Result</h3>
            <p className="mb-2">{diagnosticResult.message}</p>
            {diagnosticResult.success && diagnosticResult.event && (
              <div className="text-sm bg-white rounded p-3 mt-2 overflow-auto max-h-40">
                <pre>{JSON.stringify(diagnosticResult.event, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
        
        <div className="flex justify-center">
          <AddEventForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting || contextLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default NewEvent;
