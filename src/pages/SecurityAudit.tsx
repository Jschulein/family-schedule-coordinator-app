
/**
 * Security Audit Page - For viewing and running security tests
 * Only accessible to developers/admins
 */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Play, Download, RefreshCw } from 'lucide-react';
import { runSecurityTests, runQuickSecurityCheck } from '@/tests/security/runSecurityTests';
import { securityPerformanceMonitor } from '@/utils/security/performanceMonitor';
import { toast } from '@/components/ui/use-toast';

export const SecurityAudit = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isQuickCheck, setIsQuickCheck] = useState(false);
  const [lastReport, setLastReport] = useState<string>('');
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null);

  const handleFullAudit = async () => {
    setIsRunning(true);
    try {
      const report = await runSecurityTests();
      setLastReport(report);
      setLastRunTime(new Date());
      
      // Check if all tests passed
      const failuresDetected = report.includes('❌') || report.includes('Failed:');
      
      toast({
        title: failuresDetected ? "Security Issues Detected" : "Security Audit Complete",
        description: failuresDetected ? 
          "Some security tests failed. Review the report below." : 
          "All security tests passed successfully.",
        variant: failuresDetected ? "destructive" : "default"
      });
    } catch (error) {
      toast({
        title: "Audit Failed",
        description: "An error occurred during the security audit.",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleQuickCheck = async () => {
    setIsQuickCheck(true);
    try {
      const passed = await runQuickSecurityCheck();
      
      toast({
        title: passed ? "Quick Check Passed" : "Security Issues Found",
        description: passed ? 
          "Core security functions are working properly." : 
          "Critical security issues detected. Run full audit for details.",
        variant: passed ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Quick Check Failed",
        description: "An error occurred during the quick security check.",
        variant: "destructive"
      });
    } finally {
      setIsQuickCheck(false);
    }
  };

  const downloadReport = () => {
    if (!lastReport) return;
    
    const blob = new Blob([lastReport], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-audit-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const performanceStats = securityPerformanceMonitor.getAllStats();
  const anomalies = securityPerformanceMonitor.detectAnomalies();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Security Audit
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive database security testing and monitoring
          </p>
        </div>
        
        {lastRunTime && (
          <Badge variant="outline">
            Last run: {lastRunTime.toLocaleString()}
          </Badge>
        )}
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Security Tests
            </CardTitle>
            <CardDescription>
              Run comprehensive security audits and quick checks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleFullAudit} 
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Running Full Audit...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Run Full Security Audit
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleQuickCheck}
              disabled={isQuickCheck}
              variant="outline"
              className="w-full"
            >
              {isQuickCheck ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Running Quick Check...
                </>
              ) : (
                'Quick Security Check'
              )}
            </Button>

            {lastReport && (
              <Button 
                onClick={downloadReport}
                variant="secondary"
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Report
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>
              Security operation performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {performanceStats.length === 0 ? (
              <p className="text-muted-foreground">No performance data available</p>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Operations:</span>
                  <Badge>{performanceStats.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Anomalies:</span>
                  <Badge variant={anomalies.length > 0 ? "destructive" : "default"}>
                    {anomalies.length}
                  </Badge>
                </div>
                {anomalies.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 text-amber-600 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Performance Issues</span>
                    </div>
                    <ul className="text-sm space-y-1">
                      {anomalies.slice(0, 3).map((anomaly, index) => (
                        <li key={index} className="text-muted-foreground">
                          • {anomaly}
                        </li>
                      ))}
                      {anomalies.length > 3 && (
                        <li className="text-muted-foreground">
                          • ... and {anomalies.length - 3} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Report Display */}
      {lastReport && (
        <Card>
          <CardHeader>
            <CardTitle>Security Audit Report</CardTitle>
            <CardDescription>
              Latest security audit results and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-96">
                {lastReport}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SecurityAudit;
