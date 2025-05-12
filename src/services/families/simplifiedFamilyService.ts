/**
 * Simplified Family Service
 * Uses the improved error handling and security patterns
 */
import { supabase } from "@/integrations/supabase/client";
import { Family, FamilyMember, FamilyServiceResponse, FamilyRole } from "@/types/familyTypes";
import { handleDatabaseError } from "@/utils/error/databaseErrorMapper";
import { handleError } from "@/utils/error/errorHandler";
import { performanceTracker } from "@/utils/testing";
import { checkFamilySystemHealth } from "@/utils/diagnostics/familyHealthCheck";

/**
 * Gets all families for the current user
 * @returns All families the user is a member of
 */
export async function getUserFamilies(): Promise<FamilyServiceResponse<Family[]>> {
  const trackingId = performanceTracker.startMeasure('getUserFamilies');
  
  try {
    console.log("Fetching user families using security definer function");
    
    // Use the security definer function to avoid infinite recursion
    const { data, error } = await supabase.rpc('get_user_families_safe');
    
    if (error) {
      console.error("Error fetching user families:", error);
      return {
        data: null,
        isError: true,
        error: handleDatabaseError(error, "Fetching families")
      };
    }
    
    return {
      data: data as Family[],
      isError: false,
      error: null
    };
  } catch (error: any) {
    return {
      data: null,
      isError: true,
      error: handleDatabaseError(error, "Fetching families")
    };
  } finally {
    performanceTracker.endMeasure(trackingId);
  }
}

/**
 * Gets all members for a specific family using a security definer function
 * @param familyId The ID of the family
 * @returns All members of the family
 */
export async function getFamilyMembers(familyId: string): Promise<FamilyServiceResponse<FamilyMember[]>> {
  const trackingId = performanceTracker.startMeasure('getFamilyMembers');
  
  try {
    console.log(`Fetching members for family ${familyId}`);
    
    // Use security definer function to avoid recursion
    const { data, error } = await supabase.rpc('get_family_members_by_family_id', {
      p_family_id: familyId
    });
    
    if (error) {
      console.error("Error fetching family members:", error);
      return {
        data: null,
        isError: true,
        error: handleDatabaseError(error, "Fetching family members")
      };
    }
    
    return {
      data: data as FamilyMember[],
      isError: false,
      error: null
    };
  } catch (error: any) {
    return {
      data: null,
      isError: true,
      error: handleDatabaseError(error, "Fetching family members")
    };
  } finally {
    performanceTracker.endMeasure(trackingId);
  }
}

/**
 * Creates a new family with improved error handling and diagnostics
 * @param name The name of the family
 * @returns The newly created family
 */
export async function createFamily(name: string): Promise<FamilyServiceResponse<Family>> {
  const trackingId = performanceTracker.startMeasure('createFamilySimplified');
  
  try {
    if (!name.trim()) {
      return {
        data: null,
        isError: true,
        error: "Family name cannot be empty"
      };
    }
    
    // First run a health check to ensure the system is ready
    const healthResult = await checkFamilySystemHealth();
    if (healthResult.status === 'error' || !healthResult.canCreateFamily) {
      console.error("Family system health check failed:", healthResult);
      return {
        data: null,
        isError: true,
        error: `System check failed: ${healthResult.issues.join(', ')}`
      };
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: null,
        isError: true,
        error: "User not authenticated"
      };
    }
    
    console.log("Creating new family using safe_create_family function");
    
    // Call the security definer function to safely create the family
    const { data: familyId, error } = await supabase.rpc('safe_create_family', { 
      p_name: name, 
      p_user_id: user.id 
    });
    
    if (error) {
      console.error("Error creating family:", error);
      return {
        data: null,
        isError: true,
        error: handleDatabaseError(error, "Creating family")
      };
    }
    
    if (!familyId) {
      return {
        data: null,
        isError: true,
        error: "Failed to create family"
      };
    }
    
    // Fetch the complete family data
    const { data: families } = await getUserFamilies();
    const newFamily = families?.find(f => f.id === familyId);
    
    if (newFamily) {
      return {
        data: newFamily,
        isError: false,
        error: null
      };
    }
    
    // Run diagnostics if family isn't found
    console.warn("Family created but not found in getUserFamilies results");
    runDiagnostics(familyId, name, user.id);
    
    // Fallback in case we can't find the new family
    return {
      data: { 
        id: familyId, 
        name,
        color: '#8B5CF6',
        created_by: user.id,
        created_at: new Date().toISOString()
      } as Family,
      isError: false,
      error: null
    };
  } catch (error: any) {
    console.error("Exception in createFamily:", error);
    return {
      data: null,
      isError: true,
      error: handleDatabaseError(error, "Creating family")
    };
  } finally {
    performanceTracker.endMeasure(trackingId);
  }
}

// Helper function for diagnostics
async function runDiagnostics(familyId: string, name: string, userId: string) {
  try {
    console.group("📊 FAMILY CREATION DIAGNOSTICS");
    
    // Check for the family directly
    const { data: directFamily, error: directError } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .single();
      
    console.log("Direct family query:", directFamily || "Not found", directError);
    
    // Check for family members
    const { data: members, error: membersError } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', familyId);
      
    console.log("Family members:", members || "None found", membersError);
    
    // Run the debug function
    try {
      const { data: debug } = await supabase.rpc(
        'debug_family_creation',
        { p_name: name, p_user_id: userId }
      );
      console.log("Debug data:", debug);
    } catch (err) {
      console.error("Debug function error:", err);
    }
    
    console.groupEnd();
  } catch (err) {
    console.error("Diagnostics error:", err);
  }
}

/**
 * Fetches all invitations for a family
 * @param familyId The ID of the family
 * @returns All invitations for the family
 */
export async function getFamilyInvitations(familyId: string) {
  try {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('family_id', familyId);
      
    if (error) {
      console.error("Error fetching invitations:", error);
      throw error;
    }
    
    return {
      data,
      isError: false,
      error: null
    };
  } catch (error: any) {
    const errorMessage = handleError(error, {
      context: "Fetching invitations",
      showToast: true
    });
    
    return {
      data: null,
      isError: true,
      error: errorMessage
    };
  }
}

/**
 * Resends an invitation
 * @param invitationId The ID of the invitation
 * @returns Success or error
 */
export async function resendInvitation(invitationId: string) {
  try {
    const { data, error } = await supabase
      .from('invitations')
      .update({
        last_invited: new Date().toISOString()
      })
      .eq('id', invitationId)
      .select();
    
    if (error) {
      console.error("Error resending invitation:", error);
      throw error;
    }
    
    return {
      data,
      isError: false,
      error: null
    };
  } catch (error: any) {
    const errorMessage = handleError(error, {
      context: "Resending invitation",
      showToast: true
    });
    
    return {
      data: null,
      isError: true,
      error: errorMessage
    };
  }
}

/**
 * Invites a member to a family
 * @param familyId The ID of the family
 * @param email The email of the person to invite
 * @param role The role to assign to the person
 * @param name The name to display for the person
 * @returns Success or error
 */
export async function inviteFamilyMember(
  familyId: string,
  email: string,
  role: FamilyRole,
  name?: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: null,
        isError: true,
        error: "User not authenticated"
      };
    }
    
    const { data, error } = await supabase
      .from('invitations')
      .insert({
        family_id: familyId,
        email,
        role,
        name: name || email,
        invited_by: user.id
      })
      .select();
    
    if (error) {
      console.error("Error inviting family member:", error);
      throw error;
    }
    
    return {
      data,
      isError: false,
      error: null
    };
  } catch (error: any) {
    const errorMessage = handleError(error, {
      context: "Inviting family member",
      showToast: true
    });
    
    return {
      data: null,
      isError: true,
      error: errorMessage
    };
  }
}
