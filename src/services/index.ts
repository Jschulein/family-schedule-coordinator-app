
/**
 * Services entry point
 * Re-exports all service functionality for simplified imports
 */

// Event-related services
export * from './eventService';

// Family-related services exports with explicit naming to avoid ambiguity
export { 
  createFamily,
  fetchUserFamilies 
} from './families/core';

export { 
  fetchFamilyMembers,
  fetchMembersByFamilyId 
} from './families/members';

// Family service exports
export {
  getUserFamilies,
  getFamilyMembers,
  createFamily as createFamilySimplified,
  getFamilyInvitations,
  resendInvitation,
  inviteFamilyMember
} from './families/simplifiedFamilyService';

// Explicitly rename for disambiguation
export { getUserFamilies as getUserFamiliesFromFamily } from './familyService';
