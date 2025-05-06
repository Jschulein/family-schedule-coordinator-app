
/**
 * Family creation service
 * Consolidates all family creation logic in one place
 */

// Re-export for backward compatibility
export * from './createFamilyWithMembers';
export * from './validators';
export * from './familyCreator';

// Export renamed function for backward compatibility
import { createNewFamily } from './familyCreator';
export const createFamily = createNewFamily;
