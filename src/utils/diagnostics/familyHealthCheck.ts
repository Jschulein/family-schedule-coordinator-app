
/**
 * Family system health diagnostics utility
 * Helps diagnose issues with family-related operations
 */
import { supabase } from "@/integrations/supabase/client";

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'error';
  issues: string[];
  canCreateFamily: boolean;
  functionStatus: Record<string, boolean>;
  auth: {
    authenticated: boolean;
    userId: string | null;
  };
}

/**
 * Required functions for family functionality
 */
const REQUIRED_FUNCTIONS = [
  'get_user_families',
  'is_family_member_safe', 
  'is_family_admin_safe',
  'safe_create_family',
  'get_family_members_by_family_id'
];

/**
 * Performs a health check on the family system
 * @returns Results of the health check
 */
export async function checkFamilySystemHealth(): Promise<HealthCheckResult> {
  const issues: string[] = [];
  const functionStatus: Record<string, boolean> = {};
  let canCreateFamily = true;
  
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  const authenticated = !!session?.user;
  const userId = session?.user?.id || null;
  
  if (!authenticated) {
    issues.push("User is not authenticated");
    canCreateFamily = false;
  }
  
  // Check if required functions exist
  for (const funcName of REQUIRED_FUNCTIONS) {
    try {
      const { data, error } = await supabase.rpc('function_exists', {
        function_name: funcName
      });
      
      functionStatus[funcName] = !!data;
      
      if (error || !data) {
        issues.push(`Function ${funcName} is missing or inaccessible`);
        canCreateFamily = false;
      }
    } catch (err) {
      console.error(`Error checking function ${funcName}:`, err);
      functionStatus[funcName] = false;
      issues.push(`Error checking function ${funcName}`);
      canCreateFamily = false;
    }
  }
  
  // Test user family retrieval if authenticated
  if (authenticated) {
    try {
      const { error } = await supabase.rpc('get_user_families');
      
      if (error) {
        issues.push(`Error fetching families: ${error.message}`);
        
        if (error.message.includes('infinite recursion')) {
          issues.push("Database is experiencing recursion issues with security policies");
        }
      }
    } catch (err: any) {
      issues.push(`Exception fetching families: ${err.message || 'Unknown error'}`);
    }
  }
  
  // Determine overall status
  let status: 'healthy' | 'degraded' | 'error';
  
  if (issues.length === 0) {
    status = 'healthy';
  } else if (!canCreateFamily) {
    status = 'error';
  } else {
    status = 'degraded';
  }
  
  return {
    status,
    issues,
    canCreateFamily,
    functionStatus,
    auth: {
      authenticated,
      userId
    }
  };
}

/**
 * Runs a health check and logs the results to the console
 * Useful for debugging issues
 */
export async function runFamilySystemDiagnostics(): Promise<void> {
  console.group('Family System Diagnostics');
  console.log('Running health check...');
  
  try {
    const result = await checkFamilySystemHealth();
    
    console.log(`Status: ${result.status.toUpperCase()}`);
    console.log(`Can create family: ${result.canCreateFamily ? 'YES' : 'NO'}`);
    console.log(`Authentication: ${result.auth.authenticated ? 'YES' : 'NO'}`);
    console.log(`User ID: ${result.auth.userId || 'Not authenticated'}`);
    
    console.group('Function Status:');
    for (const [func, available] of Object.entries(result.functionStatus)) {
      console.log(`${func}: ${available ? '✅' : '❌'}`);
    }
    console.groupEnd();
    
    if (result.issues.length > 0) {
      console.group('Issues:');
      result.issues.forEach((issue, i) => console.log(`${i + 1}. ${issue}`));
      console.groupEnd();
    }
  } catch (err) {
    console.error('Error running diagnostics:', err);
  }
  
  console.groupEnd();
}
