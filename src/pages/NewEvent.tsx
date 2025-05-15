
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import AddEventForm from "@/components/AddEventForm";
import { useEvents } from "@/contexts/EventContext";
import { useState, useEffect, useRef } from "react";
import { Event } from "@/types/eventTypes";
import { useFamilyContext } from "@/contexts/family";
import { logEventFlow } from "@/utils/events";
import { performanceTracker } from "@/utils/testing/performanceTracker";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useNewEventPage } from "@/hooks/events/useNewEventPage"; // New hook

/**
 * NewEvent page component
 * Handles the creation of new events and manages form submission state
 */
const NewEvent = () => {
  // Get navigation and context hooks
  const navigate = useNavigate();
  const { activeFamilyId, families } = useFamilyContext();
  const perfMonitor = usePerformanceMonitor('NewEventPage');
  
  // Extract event handling to a custom hook
  const { 
    isSubmitting,
    isRefreshing, 
    error,
    handleSubmit,
    handleReturn,
    handleRetry
  } = useNewEventPage();
  
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
        
        {!activeFamilyId && families.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
            <p className="font-medium text-amber-800">Select a family</p>
            <p className="text-sm text-amber-700">
              Please select a family from the sidebar to share this event with family members.
            </p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
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
