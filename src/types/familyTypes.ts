
// If this file doesn't exist, we're creating it. Otherwise, we'll add to it.

// Add this to your existing Family type definitions or create if needed
export type Family = {
  id: string;
  name: string;
  color?: string;
  created_by?: string;
  created_at?: string;
};

export type FamilyMember = {
  id: string;
  family_id: string;
  user_id: string;
  name?: string;
  email: string;
  role: FamilyRole;
};

export type FamilyRole = "admin" | "member" | "child";

// Add the missing FamilyInvitation type that matches the database schema
export type FamilyInvitation = {
  id: string;
  family_id: string;
  email: string;
  name?: string;
  role: FamilyRole;
  status: string;
  invited_at: string;
  invited_by?: string;
  last_invited?: string;
};

// Response type for family service operations
export interface FamilyServiceResponse<T> {
  data: T | null;
  error: string | null;
  isError: boolean;
}

// Context type
export interface FamilyContextType {
  families: Family[];
  activeFamilyId: string | null;
  loading: boolean;
  error: string | null;
  creating: boolean;
  retryCount?: number; // New property to track retries
  fetchFamilies: () => Promise<void>;
  createFamily: (name: string) => Promise<Family | undefined>;
  handleSelectFamily: (id: string | null) => void;
}

// Options for creating a family
export interface CreateFamilyOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}
