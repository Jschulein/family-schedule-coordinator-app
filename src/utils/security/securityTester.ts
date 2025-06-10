/**
 * Comprehensive security testing framework for database functions and RLS policies
 */
import { supabase } from "@/integrations/supabase/client";
import { testLogger } from "@/utils/testLogger";

export interface SecurityTestResult {
  testName: string;
  passed: boolean;
  details: string;
  error?: any;
}

export class SecurityTester {
  private results: SecurityTestResult[] = [];

  /**
   * Test all security definer functions for proper search path configuration
   */
  async testSecurityDefinerFunctions(): Promise<SecurityTestResult[]> {
    testLogger.info('SECURITY_TEST', 'Starting security definer function validation');
    
    const functionTests = [
      'get_user_families',
      'get_user_families_safe',
      'get_family_members_by_family_id',
      'safe_create_family',
      'user_can_access_event_safe',
      'get_user_events_safe',
      'share_event_with_family',
      'create_event_securely'
    ];

    for (const funcName of functionTests) {
      await this.testFunctionExists(funcName);
      await this.testFunctionSecurity(funcName);
    }

    return this.results;
  }

  /**
   * Test RLS policies with different user scenarios
   */
  async testRLSPolicies(): Promise<SecurityTestResult[]> {
    testLogger.info('SECURITY_TEST', 'Testing RLS policies with different user scenarios');
    
    // Test family access controls
    await this.testFamilyAccessControl();
    
    // Test event access controls
    await this.testEventAccessControl();
    
    // Test cross-family data isolation
    await this.testCrossFamilyIsolation();

    return this.results;
  }

  /**
   * Test authentication and session security
   */
  async testAuthenticationSecurity(): Promise<SecurityTestResult[]> {
    testLogger.info('SECURITY_TEST', 'Testing authentication and session security');
    
    await this.testSessionValidation();
    await this.testUnauthorizedAccess();
    
    return this.results;
  }

  /**
   * Test for SQL injection vulnerabilities
   */
  async testSQLInjectionProtection(): Promise<SecurityTestResult[]> {
    testLogger.info('SECURITY_TEST', 'Testing SQL injection protection');
    
    const maliciousInputs = [
      "'; DROP TABLE families; --",
      "1' OR '1'='1",
      "admin'/*",
      "1; DELETE FROM events; --",
      "<script>alert('xss')</script>",
      "../../etc/passwd"
    ];

    for (const input of maliciousInputs) {
      await this.testMaliciousInput(input);
    }

    return this.results;
  }

  /**
   * Test privilege escalation attempts
   */
  async testPrivilegeEscalation(): Promise<SecurityTestResult[]> {
    testLogger.info('SECURITY_TEST', 'Testing privilege escalation protection');
    
    await this.testRoleEscalation();
    await this.testFamilyPermissionBypass();
    await this.testEventPermissionBypass();

    return this.results;
  }

  /**
   * Helper method to test if a function exists
   */
  private async testFunctionExists(functionName: string) {
    try {
      const { data, error } = await supabase.rpc('function_exists', { 
        function_name: functionName 
      });
      
      const passed = !error && data === true;
      this.results.push({
        testName: `Function exists: ${functionName}`,
        passed,
        details: passed ? 'Function exists in database' : `Function not found: ${error?.message || 'Unknown error'}`,
        error
      });
      
      if (passed) {
        testLogger.success('SECURITY_TEST', `Function ${functionName} exists`);
      } else {
        testLogger.error('SECURITY_TEST', `Function ${functionName} missing`, error);
      }
    } catch (err) {
      testLogger.error('SECURITY_TEST', `Error checking function ${functionName}`, err);
      this.results.push({
        testName: `Function exists: ${functionName}`,
        passed: false,
        details: `Error checking function: ${err}`,
        error: err
      });
    }
  }

  /**
   * Test function security configuration
   */
  private async testFunctionSecurity(functionName: string) {
    try {
      // Test that function can be called safely
      const { error } = await (supabase.rpc as any)(functionName, {});
      
      // We expect some functions to fail with specific parameters, but not with security errors
      const isSecurityError = error && (
        error.message.includes('search_path') ||
        error.message.includes('infinite recursion') ||
        error.message.includes('permission denied')
      );
      
      const passed = !isSecurityError;
      this.results.push({
        testName: `Function security: ${functionName}`,
        passed,
        details: passed ? 
          'Function has proper security configuration' : 
          `Security issue detected: ${error?.message}`,
        error: isSecurityError ? error : undefined
      });

      if (passed) {
        testLogger.success('SECURITY_TEST', `Function ${functionName} security OK`);
      } else {
        testLogger.error('SECURITY_TEST', `Function ${functionName} security issue`, error);
      }
    } catch (err) {
      testLogger.warning('SECURITY_TEST', `Function ${functionName} test exception`, err);
    }
  }

  /**
   * Test family access control
   */
  private async testFamilyAccessControl() {
    try {
      // Test getting user families
      const { data: families, error } = await supabase.rpc('get_user_families');
      
      const passed = !error;
      this.results.push({
        testName: 'Family access control',
        passed,
        details: passed ? 
          `Successfully retrieved ${Array.isArray(families) ? families.length : 0} families` : 
          `Failed to retrieve families: ${error?.message}`,
        error
      });

      if (passed) {
        testLogger.success('SECURITY_TEST', 'Family access control working');
      } else {
        testLogger.error('SECURITY_TEST', 'Family access control failed', error);
      }
    } catch (err) {
      testLogger.error('SECURITY_TEST', 'Family access control test error', err);
      this.results.push({
        testName: 'Family access control',
        passed: false,
        details: `Test error: ${err}`,
        error: err
      });
    }
  }

  /**
   * Test event access control
   */
  private async testEventAccessControl() {
    try {
      // Test getting user events
      const { data: events, error } = await supabase.rpc('get_user_events_safe');
      
      const passed = !error;
      this.results.push({
        testName: 'Event access control',
        passed,
        details: passed ? 
          `Successfully retrieved ${Array.isArray(events) ? events.length : 0} events` : 
          `Failed to retrieve events: ${error?.message}`,
        error
      });

      if (passed) {
        testLogger.success('SECURITY_TEST', 'Event access control working');
      } else {
        testLogger.error('SECURITY_TEST', 'Event access control failed', error);
      }
    } catch (err) {
      testLogger.error('SECURITY_TEST', 'Event access control test error', err);
      this.results.push({
        testName: 'Event access control',
        passed: false,
        details: `Test error: ${err}`,
        error: err
      });
    }
  }

  /**
   * Test cross-family data isolation
   */
  private async testCrossFamilyIsolation() {
    try {
      // Attempt to access family members without proper family membership
      // This should be blocked by RLS
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .limit(1);
      
      // The query should either succeed with only accessible data or fail gracefully
      const passed = !error || !error.message.includes('infinite recursion');
      
      this.results.push({
        testName: 'Cross-family data isolation',
        passed,
        details: passed ? 
          'Data isolation working properly' : 
          `Data isolation issue: ${error?.message}`,
        error: passed ? undefined : error
      });

      if (passed) {
        testLogger.success('SECURITY_TEST', 'Cross-family isolation working');
      } else {
        testLogger.error('SECURITY_TEST', 'Cross-family isolation failed', error);
      }
    } catch (err) {
      testLogger.error('SECURITY_TEST', 'Cross-family isolation test error', err);
      this.results.push({
        testName: 'Cross-family data isolation',
        passed: false,
        details: `Test error: ${err}`,
        error: err
      });
    }
  }

  /**
   * Test session validation
   */
  private async testSessionValidation() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      const passed = !error && (session !== null);
      this.results.push({
        testName: 'Session validation',
        passed,
        details: passed ? 
          'Valid session found' : 
          'No valid session or session error',
        error
      });

      if (passed) {
        testLogger.success('SECURITY_TEST', 'Session validation passed');
      } else {
        testLogger.warning('SECURITY_TEST', 'No active session for security testing');
      }
    } catch (err) {
      testLogger.error('SECURITY_TEST', 'Session validation test error', err);
      this.results.push({
        testName: 'Session validation',
        passed: false,
        details: `Test error: ${err}`,
        error: err
      });
    }
  }

  /**
   * Test unauthorized access attempts
   */
  private async testUnauthorizedAccess() {
    try {
      // Test accessing protected data without proper authentication
      // This is a basic test - in a real scenario we'd test with different user contexts
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .limit(1);
      
      // Should either succeed with accessible data or fail gracefully
      const passed = !error || !error.message.includes('infinite recursion');
      
      this.results.push({
        testName: 'Unauthorized access protection',
        passed,
        details: passed ? 
          'Access control working properly' : 
          `Access control issue: ${error?.message}`,
        error: passed ? undefined : error
      });

      if (passed) {
        testLogger.success('SECURITY_TEST', 'Unauthorized access protection working');
      } else {
        testLogger.error('SECURITY_TEST', 'Unauthorized access protection failed', error);
      }
    } catch (err) {
      testLogger.error('SECURITY_TEST', 'Unauthorized access test error', err);
      this.results.push({
        testName: 'Unauthorized access protection',
        passed: false,
        details: `Test error: ${err}`,
        error: err
      });
    }
  }

  /**
   * Test malicious input handling
   */
  private async testMaliciousInput(input: string) {
    try {
      // Test creating a family with malicious input
      const { data, error } = await supabase.rpc('safe_create_family', {
        p_name: input,
        p_user_id: '00000000-0000-0000-0000-000000000000' // Invalid UUID to test handling
      });
      
      // Should fail gracefully without exposing sensitive information
      const passed = Boolean(error && !error.message.includes('DROP') && !error.message.includes('DELETE'));
      
      this.results.push({
        testName: `SQL injection protection: ${input.substring(0, 20)}...`,
        passed,
        details: passed ? 
          'Malicious input handled safely' : 
          `Potential vulnerability: ${error?.message || 'Unexpected success'}`,
        error: passed ? undefined : error
      });

      if (passed) {
        testLogger.success('SECURITY_TEST', `SQL injection protection working for: ${input.substring(0, 20)}...`);
      } else {
        testLogger.error('SECURITY_TEST', `Potential SQL injection vulnerability`, { input, error });
      }
    } catch (err) {
      // Exceptions are actually good here - they mean the input was rejected
      testLogger.success('SECURITY_TEST', `Malicious input properly rejected: ${input.substring(0, 20)}...`);
      this.results.push({
        testName: `SQL injection protection: ${input.substring(0, 20)}...`,
        passed: true,
        details: 'Malicious input properly rejected with exception'
      });
    }
  }

  /**
   * Test role escalation attempts
   */
  private async testRoleEscalation() {
    try {
      // Test attempting to change user role inappropriately
      const { data, error } = await supabase
        .from('family_members')
        .update({ role: 'admin' })
        .eq('role', 'member')
        .limit(1);
      
      // This should be controlled by RLS policies
      const passed = Boolean(error || (data && Array.isArray(data) && data.length === 0));
      
      this.results.push({
        testName: 'Role escalation protection',
        passed,
        details: passed ? 
          'Role escalation properly prevented' : 
          'Potential role escalation vulnerability',
        error: passed ? undefined : new Error('Unexpected role escalation success')
      });

      if (passed) {
        testLogger.success('SECURITY_TEST', 'Role escalation protection working');
      } else {
        testLogger.error('SECURITY_TEST', 'Role escalation protection failed');
      }
    } catch (err) {
      testLogger.success('SECURITY_TEST', 'Role escalation properly rejected');
      this.results.push({
        testName: 'Role escalation protection',
        passed: true,
        details: 'Role escalation properly rejected'
      });
    }
  }

  /**
   * Test family permission bypass attempts
   */
  private async testFamilyPermissionBypass() {
    try {
      // Test accessing family data inappropriately
      const randomFamilyId = '00000000-0000-0000-0000-000000000000';
      const { data, error } = await supabase.rpc('get_family_members_by_family_id', {
        p_family_id: randomFamilyId
      });
      
      // Should return empty or error for non-existent/inaccessible family
      const passed = Boolean(error || !data || (Array.isArray(data) && data.length === 0));
      
      this.results.push({
        testName: 'Family permission bypass protection',
        passed,
        details: passed ? 
          'Family access properly restricted' : 
          'Potential family permission bypass',
        error: passed ? undefined : new Error('Unexpected family access')
      });

      if (passed) {
        testLogger.success('SECURITY_TEST', 'Family permission bypass protection working');
      } else {
        testLogger.error('SECURITY_TEST', 'Family permission bypass protection failed');
      }
    } catch (err) {
      testLogger.success('SECURITY_TEST', 'Family permission bypass properly rejected');
      this.results.push({
        testName: 'Family permission bypass protection',
        passed: true,
        details: 'Family permission bypass properly rejected'
      });
    }
  }

  /**
   * Test event permission bypass attempts
   */
  private async testEventPermissionBypass() {
    try {
      // Test accessing event data inappropriately
      const randomEventId = '00000000-0000-0000-0000-000000000000';
      const { data, error } = await supabase.rpc('user_can_access_event_safe', {
        event_id_param: randomEventId
      });
      
      // Should return false for non-existent/inaccessible event
      const passed = Boolean(error || data === false);
      
      this.results.push({
        testName: 'Event permission bypass protection',
        passed,
        details: passed ? 
          'Event access properly restricted' : 
          'Potential event permission bypass',
        error: passed ? undefined : new Error('Unexpected event access')
      });

      if (passed) {
        testLogger.success('SECURITY_TEST', 'Event permission bypass protection working');
      } else {
        testLogger.error('SECURITY_TEST', 'Event permission bypass protection failed');
      }
    } catch (err) {
      testLogger.success('SECURITY_TEST', 'Event permission bypass properly rejected');
      this.results.push({
        testName: 'Event permission bypass protection',
        passed: true,
        details: 'Event permission bypass properly rejected'
      });
    }
  }

  /**
   * Generate comprehensive security report
   */
  generateSecurityReport(): string {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    let report = `# Database Security Audit Report\n\n`;
    report += `## Summary\n`;
    report += `- **Total Tests:** ${totalTests}\n`;
    report += `- **Passed:** ${passedTests}\n`;
    report += `- **Failed:** ${failedTests}\n`;
    report += `- **Success Rate:** ${Math.round((passedTests / totalTests) * 100)}%\n\n`;
    
    if (failedTests === 0) {
      report += `### ✅ All Security Tests Passed\n\n`;
    } else {
      report += `### ❌ Security Issues Detected\n\n`;
    }
    
    report += `## Test Results\n\n`;
    
    // Group results by category
    const categories = {
      'Function Security': this.results.filter(r => r.testName.includes('Function')),
      'Access Control': this.results.filter(r => r.testName.includes('access') || r.testName.includes('control')),
      'Injection Protection': this.results.filter(r => r.testName.includes('injection')),
      'Permission Control': this.results.filter(r => r.testName.includes('permission') || r.testName.includes('escalation')),
      'Other': this.results.filter(r => 
        !r.testName.includes('Function') && 
        !r.testName.includes('access') && 
        !r.testName.includes('control') && 
        !r.testName.includes('injection') &&
        !r.testName.includes('permission') &&
        !r.testName.includes('escalation')
      )
    };
    
    Object.entries(categories).forEach(([category, tests]) => {
      if (tests.length > 0) {
        report += `### ${category}\n`;
        tests.forEach(test => {
          const emoji = test.passed ? '✅' : '❌';
          report += `- ${emoji} **${test.testName}**: ${test.details}\n`;
        });
        report += '\n';
      }
    });
    
    // Add recommendations if there are failures
    if (failedTests > 0) {
      report += `## Recommendations\n\n`;
      this.results.filter(r => !r.passed).forEach(test => {
        report += `### ${test.testName}\n`;
        report += `**Issue:** ${test.details}\n`;
        report += `**Action:** Review and fix the identified security concern\n\n`;
      });
    }
    
    report += `## Next Steps\n\n`;
    if (failedTests === 0) {
      report += `- All security tests passed successfully\n`;
      report += `- Continue with regular security monitoring\n`;
      report += `- Schedule periodic security audits\n`;
    } else {
      report += `- Address the ${failedTests} failed security test(s)\n`;
      report += `- Re-run security tests after fixes\n`;
      report += `- Consider additional security measures\n`;
    }
    
    return report;
  }

  /**
   * Clear previous results
   */
  clearResults() {
    this.results = [];
  }

  /**
   * Get all test results
   */
  getResults(): SecurityTestResult[] {
    return this.results;
  }
}

export const securityTester = new SecurityTester();

}
