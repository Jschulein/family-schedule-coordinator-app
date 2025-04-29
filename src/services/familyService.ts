
// Re-export everything from the family queries and mutations files
export * from "./familyQueries";
export * from "./familyMutations";

// Re-export the FamilyMember type for backward compatibility
export type { FamilyMember } from "@/types/familyTypes";
