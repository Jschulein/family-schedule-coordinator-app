
/**
 * Hook for monitoring component performance in production
 * 
 * This hook provides a way to measure and report performance metrics
 * for critical components and operations to help identify bottlenecks.
 */

import { useEffect, useRef } from 'react';
import { performanceTracker } from '@/utils/testing/performanceTracker';
import { getMemoryUsage } from '@/utils/testing';
import { AppPerformanceMetrics } from '@/components/testing/types';

export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const mountTime = useRef<number | null>(null);
  const interactionTimes = useRef<number[]>([]);
  
  // Start measuring on component mount
  useEffect(() => {
    const startTime = performance.now();
    mountTime.current = startTime;
    
    performanceTracker.startMeasure(`${componentName}:render`, {
      renderCount: renderCount.current,
      mountTime: startTime
    });
    
    return () => {
      if (mountTime.current) {
        const unmountTime = performance.now();
        const lifetime = unmountTime - mountTime.current;
        
        performanceTracker.endMeasure(`${componentName}:render`);
        console.log(`[Performance] ${componentName} lifetime: ${lifetime.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
  
  // Track render count
  useEffect(() => {
    renderCount.current += 1;
    
    if (renderCount.current > 1) {
      console.log(`[Performance] ${componentName} re-rendered (count: ${renderCount.current})`);
    }
  });
  
  // Methods for tracking interactions
  const trackInteraction = (interactionName: string) => {
    const startTime = performance.now();
    interactionTimes.current.push(startTime);
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      performanceTracker.measure(
        `${componentName}:interaction:${interactionName}`,
        () => {}, // Empty function since we're manually tracking
        { duration }
      );
      
      return duration;
    };
  };
  
  // Get current performance metrics
  const getPerformanceMetrics = (): AppPerformanceMetrics => {
    const now = performance.now();
    const renderTime = mountTime.current ? now - mountTime.current : 0;
    
    const interactionDelays = interactionTimes.current
      .map((time, i, arr) => i > 0 ? time - arr[i-1] : 0)
      .filter(delay => delay > 0);
    
    const avgInteractionDelay = interactionDelays.length > 0
      ? interactionDelays.reduce((sum, delay) => sum + delay, 0) / interactionDelays.length
      : 0;
    
    return {
      renderTime,
      loadTime: mountTime.current || 0,
      interactionDelay: avgInteractionDelay,
      memoryUsage: getMemoryUsage()
    };
  };
  
  return {
    trackInteraction,
    getPerformanceMetrics,
    renderCount: renderCount.current
  };
}
