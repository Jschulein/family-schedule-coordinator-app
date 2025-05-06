
import { useState } from "react";
import { createFamily } from "@/services/families";
import { toast } from "@/components/ui/use-toast";
import { Family } from "@/types/familyTypes";
import { supabase } from "@/integrations/supabase/client";
import { CreateFamilyOptions } from "./types";

/**
 * Hook for creating a new family
 */
export function useCreateFamily(options: CreateFamilyOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNewFamily = async (name: string): Promise<Family | undefined> => {
    if (!name.trim()) {
      setError("Family name cannot be empty");
      toast({ title: "Error", description: "Family name cannot be empty" });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get the current user ID from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const result = await createFamily(name, user.id);
      
      if (result.isError || !result.data) {
        const errorMsg = result.error || "Failed to create family";
        setError(errorMsg);
        toast({ title: "Error", description: errorMsg });
        if (options.onError) options.onError(errorMsg);
        return;
      }
      
      toast({ title: "Success", description: "Family created successfully!" });
      
      if (options.onSuccess) {
        options.onSuccess();
      }
      
      return result.data;
    } catch (error: any) {
      const errorMsg = error?.message || "An unexpected error occurred";
      setError(errorMsg);
      toast({ title: "Error", description: errorMsg });
      if (options.onError) options.onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return {
    createFamily: createNewFamily,
    loading,
    error
  };
}
