
/**
 * Family-related type definitions
 * Central location for all family-related types to avoid duplication
 */

/**
 * Represents a family in the system
 */
export interface Family {
  id: string;
  name: string;
  color?: string;
  created_by?: string;
  created_at?: string;
}

/**
 * Represents a member of a family
 */
export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string | null;
  email: string;
  name?: string;
  role: FamilyRole;
  joined_at?: string;
}

/**
 * Represents a family invitation
 */
export interface FamilyInvitation {
  id: string;
  family_id: string;
  email: string;
  name?: string;
  role: FamilyRole;
  status: string;
  invited_by?: string | null;
  invited_at: string;
  last_invited?: string | null;
}

/**
 * Family member role types
 */
export type FamilyRole = 'admin' | 'member' | 'child';

/**
 * Represents the response from family service functions
 */
export interface FamilyServiceResponse<T = any> {
  data: T | null;
  error: string | null;
  isError: boolean;
}

/**
 * Context type for the family context provider
 */
export interface FamilyContextType {
  families: Family[];
  activeFamilyId: string | null;
  loading: boolean;
  error: string | null;
  creating: boolean;
  fetchFamilies: () => Promise<void>;
  createFamily: (name: string) => Promise<Family | undefined>;
  handleSelectFamily: (familyId: string) => void;
}

/**
 * Options for the invitation hook
 */
export interface InvitationHookProps {
  familyId: string | null;
  refreshTrigger?: boolean;
}

/**
 * The service response type for family invitations
 */
export type InvitationServiceResponse = FamilyServiceResponse<FamilyInvitation[]>;
