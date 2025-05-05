
/**
 * Authentication testing module for family flow tests
 */
import { supabase } from "@/integrations/supabase/client";
import { testLogger } from "@/utils/testLogger";

/**
 * Test authentication flow
 */
export async function testAuthentication() {
  testLogger.info('AUTH', 'Testing authentication...');
  
  try {
    // Check if user is already authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      testLogger.success('AUTH', 'User already authenticated', { 
        user_id: sessionData.session.user.id,
        email: sessionData.session.user.email
      });
      return true;
    }
    
    // If not, try to authenticate with test account
    testLogger.info('AUTH', 'No active session found, attempting login');
    
    // These credentials should be updated to match a valid test account
    // In a real app, these should be environment variables
    const email = 'test@example.com';
    const password = 'password123';
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        testLogger.error('AUTH', 'Authentication failed', error);
        testLogger.info('AUTH', 'Authentication failed. Please make sure to create a test user in Supabase with email: test@example.com and password: password123');
        return false;
      }
      
      testLogger.success('AUTH', 'Authentication successful', {
        user: data.user?.id,
        email: data.user?.email
      });
      
      return true;
    } catch (error) {
      testLogger.error('AUTH', 'Exception during authentication', error);
      return false;
    }
  } catch (error) {
    testLogger.error('AUTH', 'Exception during authentication', error);
    return false;
  }
}
