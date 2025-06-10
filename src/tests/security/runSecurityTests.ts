
/**
 * Main security test runner
 * Executes comprehensive security tests and generates reports
 */
import { testLogger } from "@/utils/testLogger";
import { securityTester } from "@/utils/security/securityTester";
import { securityPerformanceMonitor } from "@/utils/security/performanceMonitor";

/**
 * Run comprehensive security tests
 */
export async function runSecurityTests(): Promise<string> {
  testLogger.clear();
  testLogger.info('SECURITY_AUDIT', 'Starting comprehensive database security audit');
  
  try {
    // Clear previous results
    securityTester.clearResults();
    
    // Phase 1: Security Function Validation
    testLogger.info('SECURITY_AUDIT', 'Phase 1: Testing security definer functions');
    await securityPerformanceMonitor.monitorOperation(
      'security-function-validation',
      () => securityTester.testSecurityDefinerFunctions()
    );
    
    // Phase 2: RLS Policy Testing
    testLogger.info('SECURITY_AUDIT', 'Phase 2: Testing RLS policies');
    await securityPerformanceMonitor.monitorOperation(
      'rls-policy-testing',
      () => securityTester.testRLSPolicies()
    );
    
    // Phase 3: Authentication Security
    testLogger.info('SECURITY_AUDIT', 'Phase 3: Testing authentication security');
    await securityPerformanceMonitor.monitorOperation(
      'authentication-security',
      () => securityTester.testAuthenticationSecurity()
    );
    
    // Phase 4: SQL Injection Protection
    testLogger.info('SECURITY_AUDIT', 'Phase 4: Testing SQL injection protection');
    await securityPerformanceMonitor.monitorOperation(
      'sql-injection-protection',
      () => securityTester.testSQLInjectionProtection()
    );
    
    // Phase 5: Privilege Escalation Testing
    testLogger.info('SECURITY_AUDIT', 'Phase 5: Testing privilege escalation protection');
    await securityPerformanceMonitor.monitorOperation(
      'privilege-escalation-testing',
      () => securityTester.testPrivilegeEscalation()
    );
    
    // Generate comprehensive reports
    const securityReport = securityTester.generateSecurityReport();
    const performanceReport = securityPerformanceMonitor.generatePerformanceReport();
    
    // Log summary
    const results = securityTester.getResults();
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    if (passedTests === totalTests) {
      testLogger.success('SECURITY_AUDIT', `All ${totalTests} security tests passed successfully`);
    } else {
      testLogger.error('SECURITY_AUDIT', `${totalTests - passedTests} of ${totalTests} security tests failed`);
    }
    
    // Combine reports
    const combinedReport = `${securityReport}\n\n---\n\n${performanceReport}`;
    
    console.log('SECURITY AUDIT REPORT:', combinedReport);
    return combinedReport;
    
  } catch (error) {
    testLogger.error('SECURITY_AUDIT', 'Unexpected error during security audit', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return `# Security Audit Failed\n\nUnexpected error: ${error}`;
  }
}

/**
 * Run quick security validation
 */
export async function runQuickSecurityCheck(): Promise<boolean> {
  testLogger.info('SECURITY_CHECK', 'Running quick security validation');
  
  try {
    // Test core security functions only
    await securityTester.testSecurityDefinerFunctions();
    await securityTester.testAuthenticationSecurity();
    
    const results = securityTester.getResults();
    const criticalTests = results.filter(r => 
      r.testName.includes('get_user_families') ||
      r.testName.includes('get_user_events_safe') ||
      r.testName.includes('Session validation')
    );
    
    const allCriticalPassed = criticalTests.every(r => r.passed);
    
    if (allCriticalPassed) {
      testLogger.success('SECURITY_CHECK', 'Quick security check passed');
    } else {
      testLogger.error('SECURITY_CHECK', 'Critical security issues detected');
    }
    
    return allCriticalPassed;
  } catch (error) {
    testLogger.error('SECURITY_CHECK', 'Quick security check failed', error);
    return false;
  }
}
