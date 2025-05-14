
/**
 * Family creation service
 * Consolidates all family creation logic in one place
 */

// Re-export from core
export { createFamilyCore as createFamily } from '../core';

// Re-export for backward compatibility
export * from './validators';
export * from './familyCreator';
