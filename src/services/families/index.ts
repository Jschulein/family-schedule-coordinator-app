
/**
 * Family Services
 * This module exports all family-related services organized by category
 */

// Core family services
export * from './core';

// Membership services
export * from './invitations';
export * from './members';

// Export simplified family service
export * from './simplifiedFamilyService';

// Export types from central location
export * from './types';

// Export createFamilyWithMembers directly
export * from './createFamily/createFamilyWithMembers';

// Create named exports to resolve ambiguity
export { createFamily as createFamilyCore } from './core';
export { createFamily as createFamilyLegacy } from './createFamily';
export { inviteFamilyMember as inviteFamilyMemberLegacy } from './invitations';
