
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FamilyRole } from "@/types/familyTypes";
import { createFamilyWithMembers } from "@/services/families";
import { toast } from "@/components/ui/use-toast";

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
    setValue("members", [...members, { name: "", email: "", role: "member" as FamilyRole }]);
  };

  const removeMember = (index: number) => {
    const updatedMembers = [...members];
    updatedMembers.splice(index, 1);
    setValue("members", updatedMembers);
  };

  const onSubmit = async (data: FamilyFormValues) => {
    setLoading(true);
    try {
      console.log("Creating new family:", data.name);
      
      // Ensure members data meets required type constraints
      const validMembers = data.members?.map(member => ({
        name: member.name,
        email: member.email,
        role: member.role
      })).filter(member => 
        member.name && member.email && member.role
      ) as { name: string; email: string; role: FamilyRole }[] || [];
      
      const result = await createFamilyWithMembers(data.name, validMembers);
      
      if (result.isError) {
        toast({ title: "Error", description: result.error });
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
      toast({ title: "Error", description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    loading,
    members,
    addMember,
    removeMember,
    onSubmit
  };
}
