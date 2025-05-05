
/**
 * Fallback family creation utility for testing
 */
import { supabase } from "@/integrations/supabase/client";
import { testLogger } from "@/utils/testLogger";

/**
 * Creates a family using a fallback method when all else fails
 * This is the last resort when other creation methods fail
 */
export async function createFamilyFallback(familyName: string, userId: string) {
  testLogger.info('FALLBACK_FAMILY_CREATE', 'Attempting final fallback for family creation');
  
  try {
    // Do a direct insert with a different name to avoid conflicts
    const fallbackFamilyName = `${familyName}-Fallback`;
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('families')
      .insert({ 
        name: fallbackFamilyName, 
        created_by: userId
      })
      .select('*')
      .maybeSingle();
    
    if (fallbackError) {
      testLogger.error('FALLBACK_FAMILY_CREATE', 'Final fallback family creation failed', fallbackError);
      throw fallbackError;
    }
    
    if (!fallbackData) {
      const noDataError = new Error('No fallback family data returned');
      testLogger.error('FALLBACK_FAMILY_CREATE', 'No family data returned', noDataError);
      throw noDataError;
    }
    
    testLogger.success('FALLBACK_FAMILY_CREATE', 'Fallback family creation succeeded', {
      family: fallbackData
    });
    
    return fallbackData;
  } catch (error) {
    testLogger.error('FALLBACK_FAMILY_CREATE', 'All family creation approaches failed', error);
    throw error;
  }
}
