
import { z } from "zod";
import { FamilyRole } from "@/types/familyTypes";

/**
 * Validation schema for the family creation form
 */
export const familyFormSchema = z.object({
  name: z.string().min(2, { message: "Family name must be at least 2 characters." }),
  members: z.array(
    z.object({
      name: z.string().min(2, { message: "Member name must be at least 2 characters." }),
      email: z.string().email({ message: "Please enter a valid email address." }),
      role: z.enum(["admin", "member", "child"], { 
        message: "Please select a valid role." 
      })
    })
  ).optional()
});

/**
 * Type definition for the form values
 */
export type FamilyFormValues = z.infer<typeof familyFormSchema>;
