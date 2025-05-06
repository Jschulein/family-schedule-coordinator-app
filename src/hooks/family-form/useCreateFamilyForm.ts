
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFamilyMembers } from "./useFamilyMembers";
import { useFormSubmission } from "./useFormSubmission";
import { familyFormSchema, FamilyFormValues } from "./validationSchema";

export interface UseCreateFamilyFormProps {
  onSuccess?: () => void;
}

/**
 * Main hook for the family creation form
 * Combines validation, member management, and submission handling
 */
export function useCreateFamilyForm(props: UseCreateFamilyFormProps = {}) {
  // Initialize form with react-hook-form
  const form = useForm<FamilyFormValues>({
    resolver: zodResolver(familyFormSchema),
    defaultValues: {
      name: "",
      members: []
    }
  });

  // Get member management functionality
  const { members, addMember, removeMember } = useFamilyMembers(form);
  
  // Get form submission functionality
  const { loading, errorMessage, onSubmit } = useFormSubmission({ 
    form, 
    onSuccess: props.onSuccess 
  });

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

// Re-export types and schema
export { FamilyFormValues, familyFormSchema };
