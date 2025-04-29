
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

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
        toast({ title: "Error", description: "Authentication required" });
        setLoading(false);
        return;
      }

      // First get the family IDs using the security definer function
      const { data: userFamilies, error: familiesIdError } = await supabase
        .rpc('user_families');
      
      if (familiesIdError) {
        console.error("Error fetching user family IDs:", familiesIdError);
        throw familiesIdError;
      }
      
      if (!userFamilies || userFamilies.length === 0) {
        console.log("No families found for current user");
        setFamilies([]);
        return;
      }
      
      // Extract just the family IDs
      const familyIds = userFamilies.map(f => f.family_id);
      
      // Then fetch the actual family data using the IDs
      const { data: familiesData, error: familiesError } = await supabase
        .from("families")
        .select("id, name")
        .in('id', familyIds)
        .order('name');
      
      if (familiesError) {
        console.error("Error fetching families details:", familiesError);
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
      setError(error.message || "Failed to load families. Please try again.");
      toast({ title: "Error", description: "Failed to load families" });
    } finally {
      setLoading(false);
    }
  }, [activeFamilyId]);

  const createFamily = async (name: string) => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Please enter a family name" });
      return;
    }

    setCreating(true);
    setError(null);
    
    try {
      console.log("Creating new family:", name);
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        toast({ title: "Error", description: "You must be logged in to create a family" });
        return;
      }

      console.log("User authenticated, creating family with user ID:", user.id);
      
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
      toast({ title: "Success", description: "Family created successfully!" });
      
      // Fetch all families again to make sure we have the latest data
      await fetchFamilies();
      
      handleSelectFamily(familyData.id);
      return familyData;
    } catch (error: any) {
      console.error("Error creating family:", error);
      const errorMessage = error?.message || "Failed to create family. Please try again.";
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage });
      throw error; // Propagate the error so the form can handle it
    } finally {
      setCreating(false);
    }
  };

  const handleSelectFamily = (familyId: string) => {
    console.log("Selecting family:", familyId);
    setActiveFamilyId(familyId);
    localStorage.setItem("activeFamilyId", familyId);
  };

  useEffect(() => {
    fetchFamilies();
  }, [fetchFamilies]);

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
