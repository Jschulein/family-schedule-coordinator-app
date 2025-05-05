
import { supabase } from "@/integrations/supabase/client";
import { Family } from "@/types/familyTypes";
import { handleError } from "@/utils/errorHandler";
import { FamilyServiceResponse } from "../types";

/**
 * Creates a new family in the database using the security definer function
 * @param name The name of the family to create
 * @returns The created family or an error
 */
export async function createFamily(name: string): Promise<FamilyServiceResponse<Family>> {
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
      console.error("Authentication failed:", userErr?.message);
      return {
        data: null,
        error: "You must be logged in to create a family",
        isError: true
      };
    }

    console.log("User authenticated, creating family with user ID:", user.id);
    
    // Use the security definer function
    const { data, error: functionError } = await supabase
      .rpc('safe_create_family', { 
        p_name: name, 
        p_user_id: user.id 
      });

    if (functionError) {
      console.error("Error creating family:", functionError);
      return {
        data: null,
        error: functionError.message,
        isError: true
      };
    }
    
    if (!data) {
      console.error("No data returned from safe_create_family function");
      return {
        data: null,
        error: "No data returned when creating family",
        isError: true
      };
    }
    
    // Fetch the complete family data to return
    const familyId = data;
    console.log("Family created with ID:", familyId);
    const { data: familyData, error: fetchError } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .single();
      
    if (fetchError) {
      console.error("Error fetching created family:", fetchError);
      // We still return the family ID as it was created successfully
      return {
        data: { id: familyId, name, created_by: user.id } as Family,
        error: null,
        isError: false
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
