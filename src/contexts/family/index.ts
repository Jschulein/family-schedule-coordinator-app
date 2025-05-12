
/**
 * Centralized exports for family context
 * This file serves as the main entry point for the family context
 */

export { FamilyContext } from './FamilyContext';
export { FamilyProvider } from './FamilyProvider';
export { useFamilyContext } from './useFamilyContext';

// Re-export specialized hooks for convenience
export {
  useActiveFamilyId,
  useFamilies
} from '@/hooks/family/useFamilyContext';
