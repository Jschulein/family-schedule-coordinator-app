
/**
 * Shared types for family-related hooks
 */
import { Family, FamilyMember, FamilyInvitation, FamilyRole } from "@/types/familyTypes";

/**
 * Common state for family-related hooks
 */
export interface FamilyHookState {
  loading: boolean;
  error: string | null;
}

/**
 * Result from a family operation
 */
export interface FamilyOperationResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/**
 * Props for invitation hooks
 */
export interface InvitationHookProps {
  familyId: string | null;
  refreshTrigger?: boolean;
}

/**
 * Options for family creation
 */
export interface CreateFamilyOptions {
  /** Optional callback to run on successful family creation */
  onSuccess?: () => void;
  /** Optional callback to run on family creation error */
  onError?: (error: string) => void;
}

/**
 * Result data from member management hooks
 */
export interface MemberManagementResult {
  members: FamilyMember[];
  loading: boolean;
  error: string | null;
  refreshMembers: () => Promise<void>;
}
