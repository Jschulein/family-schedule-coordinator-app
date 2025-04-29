
import { FamilyRole } from "@/types/familyTypes";

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
  user_id: string;
  email: string;
  name?: string;
  role: string;
  joined_at?: string;
}

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
