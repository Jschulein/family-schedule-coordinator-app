
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FamilyFormValues } from "./validationSchema";
import { createFamilyCore } from "@/services/families/core";
import { toast } from "@/components/ui/use-toast";
import { performanceTracker } from "@/utils/testing";
import { FamilyRole } from "@/types/familyTypes";
import { supabase } from "@/integrations/supabase/client";
import { checkFamilySystemHealth } from "@/utils/diagnostics/familyHealthCheck";

export interface UseFormSubmissionProps {
  form: UseFormReturn<FamilyFormValues>;
  onSuccess?: () => void;
  debugMode?: boolean;
}

/**
 * Hook for handling form submission with improved error handling
 */
export function useFormSubmission({ form, onSuccess, debugMode = false }: UseFormSubmissionProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { reset } = form;

  /**
   * Reset error state
   */
  const clearError = () => setErrorMessage(null);

  /**
   * Handles form submission with retry capability and diagnostics
   * @param data Form data
   */
  const onSubmit = async (data: FamilyFormValues) => {
    // Reset error state
    clearError();
    setLoading(true);
    
    // Start performance tracking
    const trackingId = performanceTracker.startMeasure('createFamilySubmission');
    
    try {
      console.log(`Creating new family (attempt ${retryCount + 1}): ${data.name}`);
      
      // Run health check if in debug mode
      if (debugMode) {
        const healthResult = await checkFamilySystemHealth();
        if (healthResult.status === 'error' || !healthResult.canCreateFamily) {
          console.error("System health check failed:", healthResult);
          setErrorMessage(`System health check failed: ${healthResult.issues.join(', ')}`);
          toast({ 
            title: "System Error", 
            description: "Family creation system is not healthy. See console for details.",
            variant: "destructive" 
          });
          return;
        }
      }
      
      // Get the current user ID from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Create the family using core service
      const result = await createFamilyCore(data.name, user.id);
      
      if (result.isError) {
        // If this is a retriable error and we haven't hit the limit yet
        if (retryCount < 2 && 
            (result.error?.includes("duplicate key value") || 
             result.error?.includes("already exists"))) {
          setRetryCount(prev => prev + 1);
          toast({
            title: "Retrying",
            description: "Encountered a recoverable issue, retrying...",
            variant: "default"
          });
          
          // Short delay before retrying
          setTimeout(() => {
            onSubmit(data);
          }, 1000);
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
      
      // Reset retry count on success
      setRetryCount(0);
      
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
    clearError,
    retryCount,
    onSubmit
  };
}
