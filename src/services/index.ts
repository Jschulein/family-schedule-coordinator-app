
/**
 * Services entry point
 * Re-exports all service functionality for simplified imports
 */

// Event-related services
export * from './eventService';

// Family-related services - use renamed exports to avoid conflicts
export { getUserFamilies as getUserFamiliesFromFamily } from './familyService';

// Re-export family services with explicit names to avoid ambiguity
export { 
  createFamilyCore,
  createFamilyLegacy,
  inviteFamilyMemberLegacy,
  fetchUserFamilies
} from './families';
