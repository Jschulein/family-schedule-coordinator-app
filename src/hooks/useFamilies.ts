
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

      const { data, error } = await supabase
        .from("family_members")
        .select("family_id, families(name, id)")
        .eq("user_id", user.id);

      if (error) throw error;

      const uniqueFamilies: Family[] = [];
      const seen = new Set();
      for (const fm of data ?? []) {
        if (fm.families && !seen.has(fm.families.id)) {
          uniqueFamilies.push({ id: fm.families.id, name: fm.families.name });
          seen.add(fm.families.id);
        }
      }
      setFamilies(uniqueFamilies);

      // Set first family as active if none selected
      if (!activeFamilyId && uniqueFamilies.length > 0) {
        handleSelectFamily(uniqueFamilies[0].id);
      } else if (activeFamilyId && !uniqueFamilies.some(f => f.id === activeFamilyId)) {
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

      const { data, error } = await supabase
        .from("families")
        .insert({ name, created_by: user.id })
        .select("id, name")
        .single();

      if (error) throw error;

      if (data) {
        const { error: memberError } = await supabase
          .from("family_members")
          .insert({
            family_id: data.id,
            user_id: user.id,
            role: "admin",
            email: user.email,
          });

        if (memberError) {
          console.error("Error adding member:", memberError);
        }

        setFamilies(prev => [...prev, { id: data.id, name: data.name }]);
        handleSelectFamily(data.id);
        toast.success("Family created successfully!");
        return data;
      }
    } catch (error: any) {
      console.error("Error creating family:", error.message);
      setError("Failed to create family. Please try again.");
      toast.error("Failed to create family");
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
