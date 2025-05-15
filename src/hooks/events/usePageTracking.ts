
import { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { performanceTracker } from "@/utils/testing/performanceTracker";

/**
 * Custom hook for tracking page lifecycle and navigation
 * @returns Navigation and tracking utilities
 */
export function usePageTracking() {
  const navigate = useNavigate();
  
  // Start performance tracking for page load
  useEffect(() => {
    const trackId = performanceTracker.startMeasure('NewEventPage:mount');
    
    return () => {
      performanceTracker.endMeasure(trackId);
    };
  }, []);
  
  /**
   * Handle return button click
   * Navigates back to home page
   */
  const handleReturn = () => {
    navigate("/");
  };

  return {
    handleReturn
  };
}
