
import { useState, useEffect } from "react";
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

  const fetchFamilies = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Authentication required");
        setLoading(false);
        return;
      }

      // Use a simpler query to reduce the chance of recursion issues
      const { data, error: familiesError } = await supabase
        .from("families")
        .select("id, name")
        .order('name');
      
      if (familiesError) throw familiesError;

      // Now get the families the user is a member of
      const { data: memberships, error: membershipsError } = await supabase
        .from("family_members")
        .select("family_id")
        .eq("user_id", user.id);
      
      if (membershipsError) throw membershipsError;
      
      // Filter to only include families where user is a member
      const familyIds = new Set(memberships?.map(m => m.family_id) || []);
      const userFamilies = data?.filter(f => familyIds.has(f.id)) || [];
      
      setFamilies(userFamilies);

      // Set first family as active if none selected
      if (!activeFamilyId && userFamilies.length > 0) {
        handleSelectFamily(userFamilies[0].id);
      } else if (activeFamilyId && !userFamilies.some(f => f.id === activeFamilyId)) {
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
  };

  const createFamily = async (name: string) => {
    if (!name.trim()) {
      toast.error("Please enter a family name");
      return;
    }

    setCreating(true);
    setError(null);
    
    try {
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

      if (familyError) throw familyError;
      
      if (!familyData) {
        throw new Error("No data returned when creating family");
      }
      
      // Let's fetch families again to make sure we have the latest data
      // This also verifies the RLS policies are working correctly
      await fetchFamilies();
      
      handleSelectFamily(familyData.id);
      toast.success("Family created successfully!");
      return familyData;
    } catch (error: any) {
      console.error("Error creating family:", error.message);
      setError("Failed to create family. Please try again.");
      toast.error("Failed to create family");
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
