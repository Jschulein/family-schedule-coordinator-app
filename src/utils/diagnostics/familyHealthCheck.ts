
import { supabase } from "@/integrations/supabase/client";
import { diagnoseFamilySystem } from "@/services/families/core";

/**
 * Health check result type
 */
export interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'error';
  issues: string[];
  canCreateFamily: boolean;
  details?: any;
}

/**
 * Checks the health of the family system
 * Important for diagnosing family-related issues
 */
export async function checkFamilySystemHealth(): Promise<HealthCheckResult> {
  try {
    const issues: string[] = [];
    let canCreateFamily = true;
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        status: 'error',
        issues: ['User not authenticated'],
        canCreateFamily: false
      };
    }
    
    // Check if safe_create_family function exists
    const { data: fnExists, error: fnError } = await supabase.rpc(
      'function_exists',
      { function_name: 'safe_create_family' }
    );
    
    if (fnError || !fnExists) {
      issues.push('safe_create_family function not found');
      canCreateFamily = false;
    }
    
    // Check if get_user_families_safe function exists
    const { data: familiesFnExists, error: familiesFnError } = await supabase.rpc(
      'function_exists',
      { function_name: 'get_user_families_safe' }
    );
    
    if (familiesFnError || !familiesFnExists) {
      issues.push('get_user_families_safe function not found');
    }
    
    // Run family system diagnostics
    const diagnosticData = await diagnoseFamilySystem();
    if (diagnosticData.error) {
      issues.push(`Diagnostic error: ${diagnosticData.error}`);
    }
    
    // Check member constraints
    if (!diagnosticData.member_constraints || 
        !Array.isArray(diagnosticData.member_constraints) || 
        !diagnosticData.member_constraints.includes('family_members_family_id_user_id_key')) {
      issues.push('Missing unique constraint on family_members');
    }
    
    // Determine overall status
    let status: 'healthy' | 'warning' | 'error' = 'healthy';
    if (!canCreateFamily) {
      status = 'error';
    } else if (issues.length > 0) {
      status = 'warning';
    }
    
    return {
      status,
      issues,
      canCreateFamily,
      details: diagnosticData
    };
  } catch (error: any) {
    console.error("Health check error:", error);
    return {
      status: 'error',
      issues: [`Health check failed: ${error.message || 'Unknown error'}`],
      canCreateFamily: false
    };
  }
}

/**
 * Runs complete diagnostics for the family system
 * Useful for debugging family-related issues
 */
export async function runFamilySystemDiagnostics(): Promise<void> {
  try {
    console.group("🔍 FAMILY SYSTEM DIAGNOSTICS");
    
    // Run health check
    const healthCheck = await checkFamilySystemHealth();
    console.log("Health check result:", healthCheck);
    
    // Check database functions
    const functions = [
      'safe_create_family', 
      'get_user_families_safe', 
      'debug_family_creation'
    ];
    
    console.log("Checking database functions...");
    for (const fn of functions) {
      const { data, error } = await supabase.rpc('function_exists', { function_name: fn });
      console.log(`- ${fn}: ${data ? 'Exists' : 'Missing'} ${error ? '(Error: ' + error.message + ')' : ''}`);
    }
    
    // Check for triggers on families table
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const diagnosticData = await diagnoseFamilySystem();
      console.log("System diagnostic data:", diagnosticData);
    }
    
    console.groupEnd();
  } catch (error) {
    console.error("Error running diagnostics:", error);
  }
}
