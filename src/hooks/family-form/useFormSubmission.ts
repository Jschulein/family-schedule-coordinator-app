
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FamilyFormValues } from "./validationSchema";
import { createFamilyCore } from "@/services/families";
import { toast } from "@/components/ui/use-toast";
import { performanceTracker } from "@/utils/testing";
import { FamilyRole } from "@/types/familyTypes";
import { supabase } from "@/integrations/supabase/client";

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
      
      // Get the current user ID from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Create the family first
      const result = await createFamilyCore(data.name, user.id);
      
      if (result.isError) {
        // Special handling for constraint violations that might still have created the family
        if (result.error?.includes("duplicate key value")) {
          toast({ 
            title: "Warning", 
            description: "Family may have been created with a warning. Please check your families list."
          });
          reset();
          if (onSuccess) {
            onSuccess();
          }
          return;
        }
        
        setErrorMessage(result.error || "Failed to create family");
        toast({ 
          title: "Error", 
          description: result.error || "Failed to create family", 
          variant: "destructive" 
        });
        return;
      }
      
      // At this point we would handle invitations separately if needed
      
      toast({ 
        title: "Success", 
        description: "Family created successfully!" 
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
