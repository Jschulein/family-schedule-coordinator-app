
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

export type Family = {
  id: string;
  name: string;
};

export const useFamilies = () => {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [activeFamilyId, setActiveFamilyId] = useState<string | null>(() =>
    localStorage.getItem("activeFamilyId")
  );

  const fetchFamilies = useCallback(async () => {
    console.log("Fetching families...");
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Authentication required");
        setLoading(false);
        return;
      }

      // Direct query to families table
      const { data: familiesData, error: familiesError } = await supabase
        .from("families")
        .select("id, name");
      
      if (familiesError) {
        console.error("Error fetching families:", familiesError);
        throw familiesError;
      }
      
      console.log(`Successfully fetched ${familiesData?.length || 0} families`);
      setFamilies(familiesData || []);

      // Set first family as active if none selected
      if (!activeFamilyId && familiesData && familiesData.length > 0) {
        handleSelectFamily(familiesData[0].id);
      } else if (activeFamilyId && !familiesData?.some(f => f.id === activeFamilyId)) {
        setActiveFamilyId(null);
        localStorage.removeItem("activeFamilyId");
      }
    } catch (error: any) {
      console.error("Error fetching families:", error.message);
      setError("Failed to load families. Please try again.");
      toast.error("Failed to load families");
    } finally {
      setLoading(false);
    }
  }, [activeFamilyId]);

  const createFamily = async (name: string) => {
    if (!name.trim()) {
      toast.error("Please enter a family name");
      return;
    }

    setCreating(true);
    setError(null);
    
    try {
      console.log("Creating new family:", name);
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        toast.error("You must be logged in to create a family");
        return;
      }

      // Step 1: Create the family
      const { data: familyData, error: familyError } = await supabase
        .from("families")
        .insert({ name, created_by: user.id })
        .select("id, name")
        .single();

      if (familyError) {
        console.error("Error creating family:", familyError);
        throw familyError;
      }
      
      if (!familyData) {
        throw new Error("No data returned when creating family");
      }
      
      console.log("Family created successfully:", familyData);
      
      // Fetch all families again to make sure we have the latest data
      // We'll rely on the database trigger we set up to handle creating family_member entry
      await fetchFamilies();
      
      handleSelectFamily(familyData.id);
      return familyData;
    } catch (error: any) {
      console.error("Error creating family:", error);
      const errorMessage = error?.message || "Failed to create family. Please try again.";
      setError(errorMessage);
      throw error; // Propagate the error so the form can handle it
    } finally {
      setCreating(false);
    }
  };

  const handleSelectFamily = (familyId: string) => {
    setActiveFamilyId(familyId);
    localStorage.setItem("activeFamilyId", familyId);
  };

  useEffect(() => {
    fetchFamilies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    families,
    loading,
    error,
    creating,
    activeFamilyId,
    fetchFamilies,
    createFamily,
    handleSelectFamily,
  };
};
