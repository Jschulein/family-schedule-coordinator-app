
import { Family, FamilyMember, FamilyRole } from "@/types/familyTypes";

/**
 * Represents the response from family service functions
 */
export interface FamilyServiceResponse<T = any> {
  data: T | null;
  error: string | null;
  isError: boolean;
}

/**
 * Represents a family invitation
 */
export interface FamilyInvitation {
  id: string;
  family_id: string;
  email: string;
  name?: string;
  role: string;
  status: string;
  invited_by?: string;
  invited_at: string;
  last_invited?: string;
}
