
import { FamilyRole } from "@/types/familyTypes";

/**
 * Validates a family name
 * @param name The family name to validate
 * @returns Error message or null if valid
 */
export function validateFamilyName(name: string): string | null {
  if (!name) {
    return "Family name cannot be empty";
  }
  
  if (!name.trim()) {
    return "Family name cannot be only whitespace";
  }
  
  if (name.length < 2) {
    return "Family name must be at least 2 characters";
  }
  
  if (name.length > 100) {
    return "Family name must be less than 100 characters";
  }
  
  return null;
}

/**
 * Validates and normalizes family members data
 * @param members The members data to validate
 * @returns Normalized members data with invalid entries removed
 */
export function validateAndNormalizeMembers(
  members: Array<{ name: string; email: string; role: FamilyRole }>
): Array<{ name: string; email: string; role: FamilyRole }> {
  if (!members || !Array.isArray(members) || members.length === 0) {
    return [];
  }
  
  // Filter out invalid members
  return members
    .filter(member => {
      // Must have an email
      if (!member.email || !member.email.trim()) {
        return false;
      }
      
      // Must have a valid role
      const validRoles: FamilyRole[] = ['admin', 'member', 'child'];
      if (!validRoles.includes(member.role)) {
        return false;
      }
      
      return true;
    })
    .map(member => ({
      name: member.name || member.email.split('@')[0],
      email: member.email.trim().toLowerCase(),
      role: member.role
    }));
}
