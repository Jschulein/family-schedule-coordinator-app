
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FamilyRole } from "@/types/familyTypes";
import { createFamilyCore } from "@/services/families";
import { toast } from "@/components/ui/use-toast";
import { performanceTracker } from "@/utils/testing";
import { supabase } from "@/integrations/supabase/client";

// Define validation schema
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

export type FamilyFormValues = z.infer<typeof familyFormSchema>;

export interface UseCreateFamilyFormProps {
  onSuccess?: () => void;
}

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

  const addMember = () => {
    // Performance tracking
    const trackingId = performanceTracker.startMeasure('addFamilyMember');
    
    setValue("members", [...members, { name: "", email: "", role: "member" as FamilyRole }]);
    
    performanceTracker.endMeasure(trackingId);
  };

  const removeMember = (index: number) => {
    const updatedMembers = [...members];
    updatedMembers.splice(index, 1);
    setValue("members", updatedMembers);
  };

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
      
      const result = await createFamilyCore(data.name, user.id);
      
      if (result.isError) {
        setErrorMessage(result.error || "Failed to create family");
        toast({ 
          title: "Error", 
          description: result.error || "Failed to create family", 
          variant: "destructive" 
        });
        return;
      }
      
      // We now separate family creation from member invitations for better code organization
      
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
    form,
    loading,
    members,
    errorMessage,
    addMember,
    removeMember,
    onSubmit: form.handleSubmit(onSubmit)
  };
}
