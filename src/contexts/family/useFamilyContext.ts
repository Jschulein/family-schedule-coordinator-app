
/**
 * Primary hook for accessing the family context
 * Provides safe access to family context with error handling
 */
import { useContext } from 'react';
import { FamilyContext } from './FamilyContext';

/**
 * Hook to access the family context
 * @returns The family context
 * @throws Error if used outside of FamilyProvider
 */
export function useFamilyContext() {
  const context = useContext(FamilyContext);
  
  if (context === undefined) {
    throw new Error('useFamilyContext must be used within a FamilyProvider');
  }
  
  return context;
}
