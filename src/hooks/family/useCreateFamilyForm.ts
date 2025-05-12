
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useCallback } from "react";
import { Family, FamilyRole } from "@/types/familyTypes";
import { toast } from "@/components/ui/use-toast";
import { createFamilyCore } from "@/services/families";
import { supabase } from "@/integrations/supabase/client";
import { familyFormSchema, FamilyFormValues } from "@/hooks/family-form/validationSchema";

export interface UseCreateFamilyFormProps {
  onSuccess?: () => void;
}

/**
 * Hook for the family creation form - moved from root hooks directory
 * to family-specific hook folder
 */
export function useCreateFamilyForm({ onSuccess }: UseCreateFamilyFormProps = {}) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Initialize form with react-hook-form
  const form = useForm<FamilyFormValues>({
    resolver: zodResolver(familyFormSchema),
    defaultValues: {
      name: "",
      members: []
    }
  });

  const { setValue, reset, watch } = form;
  const members = watch("members") || [];

  const addMember = useCallback(() => {
    setValue("members", [...members, { name: "", email: "", role: "member" as FamilyRole }]);
  }, [members, setValue]);

  const removeMember = useCallback((index: number) => {
    const updatedMembers = [...members];
    updatedMembers.splice(index, 1);
    setValue("members", updatedMembers);
  }, [members, setValue]);

  const onSubmit = async (data: FamilyFormValues) => {
    setErrorMessage(null);
    setLoading(true);
    
    try {
      console.log("Creating new family:", data.name);
      
      // Get the current user ID from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Updated to use createFamilyCore instead of createFamily
      const familyResult = await createFamilyCore(data.name, user.id);
      
      if (familyResult.isError || !familyResult.data) {
        throw new Error(familyResult.error || "Failed to create family");
      }
      
      const newFamily = familyResult.data as Family;
      
      // Here we would handle inviting members, but that's now in a separate flow
      // for better separation of concerns
      
      toast({ title: "Success", description: "Family created successfully!" });
      
      // Reset the form
      reset();
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      return newFamily;
    } catch (error: any) {
      console.error("Error in family creation form submission:", error);
      const errorMessage = error?.message || "Failed to create family. Please try again.";
      setErrorMessage(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    loading,
    members,
    errorMessage,
    addMember,
    removeMember,
    onSubmit: form.handleSubmit(onSubmit)
  };
}
