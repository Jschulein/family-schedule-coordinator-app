
import { useRef, useEffect } from 'react';
import { performanceTracker } from '@/utils/testing/performanceTracker';
import { logEventFlow } from '@/utils/events';

/**
 * Custom hook for tracking form performance metrics
 * @returns Performance tracking utilities
 */
export function useFormPerformance() {
  // Refs for tracking performance
  const formMountTime = useRef<number>(performance.now());
  const formSessionId = useRef<string>(`form-${Date.now()}`);
  const lastSubmitTime = useRef<number>(0);
  
  // Start tracking form performance on mount
  useEffect(() => {
    const trackId = performanceTracker.startMeasure('EventForm:mount', {
      sessionId: formSessionId.current
    });
    
    return () => {
      performanceTracker.endMeasure(trackId);
    };
  }, []);
  
  /**
   * Start tracking form submission performance
   * @param name Event name for tracking context
   */
  const trackSubmissionStart = (name: string) => {
    performanceTracker.startMeasure('EventForm:submission:start', { name });
    lastSubmitTime.current = performance.now();
    logEventFlow('EventForm', 'Form submission initiated', { name });
  };
  
  /**
   * Log completion of form submission
   * @param name Event name for tracking context
   */
  const trackSubmissionComplete = (name: string) => {
    performanceTracker.measure('EventForm:submission:complete', 
      () => {
        logEventFlow('EventForm', 'Form submission complete', { 
          name, 
          elapsedTime: performance.now() - lastSubmitTime.current 
        });
      }
    );
  };
  
  /**
   * Log errors during submission process
   * @param error Error object or message
   */
  const trackSubmissionError = (error: any) => {
    performanceTracker.measure('EventForm:submission:error', 
      () => console.error('Form submission error:', error)
    );
  };

  return {
    lastSubmitTime,
    trackSubmissionStart,
    trackSubmissionComplete,
    trackSubmissionError
  };
}
