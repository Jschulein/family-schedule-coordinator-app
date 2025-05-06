
import { FamilyRole } from "@/types/familyTypes";

/**
 * Validates input parameters for family creation
 * @param name Family name to validate
 * @returns Error message or null if valid
 */
export function validateFamilyName(name: string): string | null {
  if (!name || name.trim() === '') {
    console.error("Invalid family name provided");
    return "Family name is required";
  }
  return null;
}

/**
 * Validates and normalizes family member data
 * @param members Array of family members to validate
 * @returns Validated and normalized members
 */
export function validateAndNormalizeMembers(
  members?: Array<{ name: string; email: string; role: FamilyRole }>
): Array<{ name: string; email: string; role: FamilyRole }> {
  if (!members || members.length === 0) {
    return [];
  }

  // Filter out invalid members and normalize emails
  const validMembers = members
    .filter(member => member.name && member.email && member.role)
    .map(member => ({
      name: member.name,
      email: member.email.toLowerCase(), // Normalize email
      role: member.role
    }));

  // Remove duplicates by email
  const uniqueEmails = new Set<string>();
  return validMembers.filter(member => {
    const isDuplicate = uniqueEmails.has(member.email);
    uniqueEmails.add(member.email);
    return !isDuplicate;
  });
}
