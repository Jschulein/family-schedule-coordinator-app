
/**
 * Family Services
 * This module exports all family-related services organized by category
 */

// Core family services - use named exports to avoid conflicts with createFamily
export { fetchUserFamilies } from './core';

// Membership services - use named exports to avoid conflicts
export { fetchFamilyInvitations, resendFamilyInvitation } from './invitations';
export * from './members';

// Export simplified family service
export * from './simplifiedFamilyService';

// Export types from central location
export * from './types';

// Export createFamilyWithMembers directly
export * from './createFamily/createFamilyWithMembers';

// Create named exports to resolve ambiguity
export { createFamilyCore } from './core';
export { createFamily as createFamilyLegacy } from './createFamily';
export { inviteFamilyMember as inviteFamilyMemberLegacy } from './invitations';
