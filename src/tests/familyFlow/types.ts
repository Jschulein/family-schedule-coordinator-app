
/**
 * Common types used in family flow testing
 */

/**
 * Represents a family member for testing purposes
 */
export type FamilyMember = {
  name: string;
  email: string;
  role: 'member' | 'admin';
};

/**
 * Family data structure returned from database
 */
export type Family = {
  id: string;
  name: string;
  color?: string;
  created_by?: string;
  created_at?: string;
};
