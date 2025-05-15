
import { createContext, useContext, ReactNode } from 'react';
import { Event, EventContextType } from '@/types/eventTypes';
import { useEventData } from '@/hooks/useEventData';
import { createAddEventOperation, createUpdateEventOperation, createDeleteEventOperation } from './operations';

/**
 * Context for managing events throughout the application
 * Handles CRUD operations and manages loading states
 */
const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: ReactNode }) {
  // Use the enhanced useEventData hook with improved loading states
  const { 
    events, 
    setEvents, 
    loading,          // Kept for backward compatibility 
    initialLoading,   // Only true during first data load
    operationLoading, // True during data operations
    isRefreshing,     // True when refreshing existing data
    error, 
    offlineMode, 
    refetchEvents,
    setOperationLoading // Now exposed to allow control from context methods
  } = useEventData();

  // Create the CRUD operations using our factory functions
  const addEvent = createAddEventOperation(
    events, 
    setEvents, 
    setOperationLoading, 
    offlineMode, 
    refetchEvents
  );

  const updateEvent = createUpdateEventOperation(
    setEvents,
    setOperationLoading,
    offlineMode,
    refetchEvents
  );

  const deleteEvent = createDeleteEventOperation(
    setEvents,
    setOperationLoading,
    offlineMode
  );

  return (
    <EventContext.Provider 
      value={{ 
        // Data
        events, 
        
        // Actions
        addEvent, 
        updateEvent, 
        deleteEvent, 
        refetchEvents,
        
        // Loading states - clearly named and exposed
        loading,          // Kept for backward compatibility
        initialLoading,   // Only true during first data load
        operationLoading, // True during data operations
        isRefreshing,     // True when refreshing existing data
        
        // Status
        error, 
        offlineMode
      }}
    >
      {children}
    </EventContext.Provider>
  );
}

/**
 * Hook to access the event context
 * @returns EventContextType
 * @throws Error if used outside of EventProvider
 */
export function useEvents() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
}
