
/**
 * Family system health check utilities
 * Used to diagnose issues with family creation and management
 */
import { supabase } from "@/integrations/supabase/client";

// Define proper types for health check results
interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'error';
  issues: string[];
  canCreateFamily: boolean;
  details?: any;
}

// Define type for diagnostic data
interface DiagnosticData {
  member_constraints?: Array<{
    constraint_name: string;
    table_name: string;
  }>;
  functions?: string[];
  permissions?: Record<string, boolean>;
  user_families?: any[]; 
  event_access?: boolean;
}

/**
 * Checks the health of the family system
 * @returns Health status and details
 */
export async function checkFamilySystemHealth(): Promise<HealthCheckResult> {
  try {
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'error' = 'healthy';
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      issues.push("Authentication issue: " + (authError?.message || "Not authenticated"));
      return {
        status: 'error',
        issues,
        canCreateFamily: false
      };
    }
    
    // Check if required database functions exist
    const { data: safeCreateFamilyExists, error: fnError1 } = await supabase.rpc(
      'function_exists', 
      { function_name: 'safe_create_family' }
    );
    
    const { data: getUserFamiliesExists, error: fnError2 } = await supabase.rpc(
      'function_exists', 
      { function_name: 'get_user_families' }
    );

    const { data: getUserEventsSafeExists, error: fnError3 } = await supabase.rpc(
      'function_exists', 
      { function_name: 'get_user_events_safe' }
    );
    
    if (fnError1 || fnError2 || !safeCreateFamilyExists || !getUserFamiliesExists) {
      issues.push("Missing required database functions");
      status = 'error';
    }
    
    // Try to get diagnostic information
    let diagnostics: DiagnosticData | null = null;
    try {
      // Check if we have direct access to the families table
      const { data: familiesData, error: familyQueryError } = await supabase
        .from('families')
        .select('id')
        .limit(1);
        
      if (familyQueryError) {
        issues.push("Cannot access families table: " + familyQueryError.message);
        status = status === 'healthy' ? 'warning' : status;
      }
      
      // Check if we have the family_members table constraints
      const { data: constraintsCheck } = await supabase.rpc(
        'function_exists',
        { function_name: 'get_family_members_by_family_id' }
      );
      
      // Check if event access works
      let eventAccessWorks = false;
      if (getUserEventsSafeExists) {
        const { data: eventCheck, error: eventError } = await supabase.rpc('get_user_events_safe');
        eventAccessWorks = !eventError && eventCheck !== null;
        
        if (eventError) {
          issues.push("Events access error: " + eventError.message);
          status = status === 'healthy' ? 'warning' : status;
        }
      } else {
        issues.push("Missing get_user_events_safe function");
        status = status === 'healthy' ? 'warning' : status;
      }
      
      // Try to fetch user families directly to diagnose issues
      const { data: userFamilies, error: userFamiliesError } = await supabase.rpc('get_user_families');
      
      if (userFamiliesError) {
        issues.push("Cannot fetch user families: " + userFamiliesError.message);
        status = status === 'healthy' ? 'warning' : status;
      }
      
      diagnostics = {
        functions: [
          'safe_create_family', 
          'get_user_families', 
          'get_family_members_by_family_id',
          'get_user_events_safe'
        ].filter((fn, index) => {
          if (index === 0) return safeCreateFamilyExists;
          if (index === 1) return getUserFamiliesExists; 
          if (index === 2) return constraintsCheck;
          if (index === 3) return getUserEventsSafeExists;
          return false;
        }),
        permissions: {
          can_select_families: familiesData !== null,
          can_invoke_functions: safeCreateFamilyExists && getUserFamiliesExists,
          events_access_works: eventAccessWorks
        },
        user_families: userFamilies || []
      };
      
      // Check if member constraints exist (this is a placeholder)
      if (!constraintsCheck) {
        issues.push("Missing family_members unique constraint or members function");
        status = status === 'healthy' ? 'warning' : status;
      }
    } catch (err) {
      console.error("Error running diagnostics:", err);
      issues.push("Diagnostics error");
      status = 'warning';
    }
    
    // Final result
    return {
      status,
      issues,
      canCreateFamily: status !== 'error',
      details: diagnostics
    };
  } catch (err) {
    console.error("Health check error:", err);
    return {
      status: 'error',
      issues: ["Unexpected error during health check"],
      canCreateFamily: false
    };
  }
}

/**
 * Runs all system diagnostics for family functionality
 * @returns Diagnostic results as console output
 */
export async function runFamilySystemDiagnostics(): Promise<void> {
  console.group("🔍 FAMILY SYSTEM DIAGNOSTICS");
  
  try {
    console.log("Running health check...");
    const health = await checkFamilySystemHealth();
    console.log(`Health status: ${health.status.toUpperCase()}`);
    
    if (health.issues.length > 0) {
      console.log("Issues found:", health.issues);
    }
    
    if (health.details) {
      console.log("Diagnostic details:", health.details);
    }
    
    // Get user details
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log("Current user:", { id: user.id, email: user.email });
      
      // Check if user has families
      const { data: families, error: familiesError } = await supabase.rpc('get_user_families');
      
      if (familiesError) {
        console.error("Error fetching families:", familiesError);
        
        // Try fallback approach to fetch families
        const { data: directFamilies, error: directError } = await supabase
          .from('families')
          .select('*')
          .order('name');
          
        if (!directError && directFamilies) {
          console.log("Direct family query returned:", directFamilies);
        } else {
          console.error("Direct family query also failed:", directError);
        }
      } else {
        console.log(`User has ${families?.length || 0} families`);
        if (families && families.length > 0) {
          console.table(families);
        }
      }
      
      // Check if get_user_events_safe function works
      try {
        const { data: events, error: eventsError } = await supabase.rpc('get_user_events_safe');
        if (eventsError) {
          console.error("Error using get_user_events_safe:", eventsError);
        } else {
          console.log(`User has access to ${events?.length || 0} events`);
        }
      } catch (err) {
        console.error("Error checking events function:", err);
      }
    }
  } catch (err) {
    console.error("Error in diagnostics:", err);
  } finally {
    console.groupEnd();
  }
  
  return;
}
