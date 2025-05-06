
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FamilyFormValues } from "./validationSchema";
import { createFamilyWithMembers } from "@/services/families";
import { toast } from "@/components/ui/use-toast";
import { performanceTracker } from "@/utils/testing";
import { FamilyRole } from "@/types/familyTypes";

export interface UseFormSubmissionProps {
  form: UseFormReturn<FamilyFormValues>;
  onSuccess?: () => void;
}

/**
 * Hook for handling form submission
 */
export function useFormSubmission({ form, onSuccess }: UseFormSubmissionProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { reset } = form;

  /**
   * Handles form submission
   * @param data Form data
   */
  const onSubmit = async (data: FamilyFormValues) => {
    // Reset error state
    setErrorMessage(null);
    setLoading(true);
    
    // Start performance tracking
    const trackingId = performanceTracker.startMeasure('createFamily');
    
    try {
      console.log("Creating new family:", data.name);
      
      // Ensure members data meets required type constraints and remove duplicates
      let validMembers = data.members?.map(member => ({
        name: member.name,
        email: member.email.toLowerCase(), // Normalize email for comparison
        role: member.role
      })).filter(member => 
        member.name && member.email && member.role
      ) as { name: string; email: string; role: FamilyRole }[] || [];
      
      // Remove duplicate emails as API will reject them anyway
      const uniqueEmails = new Set();
      validMembers = validMembers.filter(member => {
        const isDuplicate = uniqueEmails.has(member.email);
        uniqueEmails.add(member.email);
        return !isDuplicate;
      });
      
      const result = await createFamilyWithMembers(data.name, validMembers);
      
      if (result.isError) {
        setErrorMessage(result.error || "Failed to create family");
        toast({ 
          title: "Error", 
          description: result.error || "Failed to create family", 
          variant: "destructive" 
        });
        return;
      }
      
      toast({ 
        title: "Success", 
        description: validMembers.length > 0 
          ? `Family created and ${validMembers.length} members invited!`
          : "Family created successfully!" 
      });
      
      // Reset the form
      reset();
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error: any) {
      console.error("Error in family creation form submission:", error);
      const errorMessage = error?.message || "Failed to create family. Please try again.";
      setErrorMessage(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
      performanceTracker.endMeasure(trackingId);
    }
  };

  return {
    loading,
    errorMessage,
    onSubmit
  };
}
