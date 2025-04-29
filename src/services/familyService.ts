
import { supabase } from "@/integrations/supabase/client";
import { handleError } from "@/utils/errorHandler";
import { Family, FamilyMember } from "@/types/familyTypes";

/**
 * Fetches all families that the current user belongs to
 * @returns An object containing families data and loading/error states
 */
export async function fetchUserFamilies() {
  console.log("Fetching families...");
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { 
        data: null, 
        error: "Authentication required", 
        isError: true 
      };
    }

    // First get the family IDs using the security definer function
    const { data: userFamilies, error: familiesIdError } = await supabase
      .rpc('user_families');
    
    if (familiesIdError) {
      console.error("Error fetching user family IDs:", familiesIdError);
      return { 
        data: null, 
        error: familiesIdError.message, 
        isError: true 
      };
    }
    
    if (!userFamilies || userFamilies.length === 0) {
      console.log("No families found for current user");
      return { 
        data: [], 
        error: null, 
        isError: false 
      };
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
      return { 
        data: null, 
        error: familiesError.message, 
        isError: true 
      };
    }
    
    console.log(`Successfully fetched ${familiesData?.length || 0} families`);
    return { 
      data: familiesData as Family[], 
      error: null, 
      isError: false 
    };
  } catch (error: any) {
    const errorMessage = handleError(error, {
      context: "Fetching families",
      showToast: true
    });
    return { 
      data: null, 
      error: errorMessage, 
      isError: true 
    };
  }
}

/**
 * Creates a new family in the database
 * @param name The name of the family to create
 * @returns The created family or an error
 */
export async function createFamily(name: string) {
  if (!name.trim()) {
    return {
      data: null,
      error: "Please enter a family name",
      isError: true
    };
  }
  
  try {
    console.log("Creating new family:", name);
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return {
        data: null,
        error: "You must be logged in to create a family",
        isError: true
      };
    }

    console.log("User authenticated, creating family with user ID:", user.id);
    
    // First create the family
    const { data: familyData, error: familyError } = await supabase
      .from("families")
      .insert({ name, created_by: user.id })
      .select("id, name")
      .single();

    if (familyError) {
      console.error("Error creating family:", familyError);
      return {
        data: null,
        error: familyError.message,
        isError: true
      };
    }
    
    if (!familyData) {
      return {
        data: null,
        error: "No data returned when creating family",
        isError: true
      };
    }
    
    console.log("Family created successfully:", familyData);
    return {
      data: familyData as Family,
      error: null,
      isError: false
    };
  } catch (error: any) {
    const errorMessage = handleError(error, {
      context: "Creating family",
      showToast: true
    });
    return {
      data: null,
      error: errorMessage,
      isError: true
    };
  }
}

/**
 * Fetches all family members for the families that the current user belongs to
 * @returns An object containing family members data and loading/error states
 */
export async function fetchFamilyMembers() {
  try {
    // Get user's families through the secure function
    const { data: userFamilies, error: familiesError } = await supabase
      .rpc('user_families');

    if (familiesError) {
      console.error("Error fetching user families:", familiesError);
      return { 
        data: null, 
        error: "Failed to load family information", 
        isError: true 
      };
    }

    if (!userFamilies || userFamilies.length === 0) {
      console.log("No families found for current user");
      return { 
        data: [], 
        error: null, 
        isError: false 
      };
    }
    
    // Extract just the family IDs
    const familyIds = userFamilies.map(f => f.family_id);
    
    // Fetch members directly by family IDs
    const { data: members, error: membersError } = await supabase
      .from('family_members')
      .select('*')
      .in('family_id', familyIds)
      .order('email');

    if (membersError) {
      console.error("Error fetching family members:", membersError);
      return { 
        data: null, 
        error: "Failed to load family members", 
        isError: true 
      };
    }

    console.log(`Successfully loaded ${members?.length || 0} family members`);
    return { 
      data: members as FamilyMember[], 
      error: null, 
      isError: false 
    };
  } catch (err: any) {
    const errorMessage = handleError(err, {
      context: "Fetching family members",
      showToast: true
    });
    return { 
      data: null, 
      error: errorMessage, 
      isError: true 
    };
  }
}
