
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CheckCircle2, AlertCircle, AlertTriangle, Timer } from "lucide-react";
import { testFamilyCreationFlow } from "@/tests";
import { convertMarkdownToHtml, extractReportStats } from "@/utils/markdown";
import { Badge } from "@/components/ui/badge";

const TestFamilyFlowPage = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [testStats, setTestStats] = useState<{
    success: boolean;
    hasWarnings: boolean;
    errorCount: number;
    warningCount: number;
  } | null>(null);
  
  const runTest = async () => {
    setIsRunning(true);
    setReport(null);
    setError(null);
    setTestStats(null);
    setExecutionTimeMs(null);
    setTimestamp(null);
    
    const startTime = performance.now();
    
    try {
      const result = await testFamilyCreationFlow();
      setReport(result);
      
      // Use the centralized utility to extract test statistics
      setTestStats(extractReportStats(result));
      
      // Set execution time and timestamp
      const endTime = performance.now();
      setExecutionTimeMs(Math.round(endTime - startTime));
      setTimestamp(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Test error:', err);
      
      // Set execution time even for errors
      const endTime = performance.now();
      setExecutionTimeMs(Math.round(endTime - startTime));
      setTimestamp(new Date().toISOString());
    } finally {
      setIsRunning(false);
    }
  };
  
  // Format execution time
  const formattedExecutionTime = executionTimeMs 
    ? (executionTimeMs < 1000 
        ? `${executionTimeMs}ms` 
        : `${(executionTimeMs / 1000).toFixed(2)}s`)
    : null;
  
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Family Creation Flow Test</h1>
            <p className="text-gray-500 mt-1">
              Tests the end-to-end process of creating families and inviting members
            </p>
          </div>
          <Button 
            onClick={runTest} 
            disabled={isRunning}
            className="min-w-[120px]"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : "Run Test"}
          </Button>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Test Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {testStats && !error && (
          <Alert 
            className={`mb-6 ${
              testStats.success 
                ? 'bg-green-50 border-green-500' 
                : testStats.hasWarnings && testStats.errorCount === 0
                  ? 'bg-yellow-50 border-yellow-500'
                  : 'bg-red-50 border-red-500'
            }`}
          >
            {testStats.success ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : testStats.hasWarnings && testStats.errorCount === 0 ? (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            
            <AlertTitle className={`${
              testStats.success 
                ? 'text-green-600' 
                : testStats.hasWarnings && testStats.errorCount === 0
                  ? 'text-yellow-600'
                  : 'text-red-600'
            }`}>
              {testStats.success 
                ? 'Test Completed Successfully' 
                : testStats.hasWarnings && testStats.errorCount === 0
                  ? 'Test Completed with Warnings'
                  : 'Test Failed'}
            </AlertTitle>
            
            <AlertDescription className={`${
              testStats.success 
                ? 'text-green-600' 
                : testStats.hasWarnings && testStats.errorCount === 0
                  ? 'text-yellow-600'
                  : 'text-red-600'
            }`}>
              {testStats.success 
                ? 'All tests passed successfully. See the detailed report below.'
                : testStats.hasWarnings && testStats.errorCount === 0
                  ? `Test completed with ${testStats.warningCount} warning(s). See the detailed report below.`
                  : `Test failed with ${testStats.errorCount} error(s). See the detailed report below.`}
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Results of the family creation flow test, including authentication, family creation, and data validation
            </CardDescription>
            {formattedExecutionTime && timestamp && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
                <Timer className="h-4 w-4" />
                <span>Execution time: {formattedExecutionTime}</span>
                <Badge variant="outline" className="ml-auto">
                  {new Date(timestamp).toLocaleString()}
                </Badge>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isRunning ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-center text-muted-foreground">
                  Running family creation flow tests...
                </p>
              </div>
            ) : report ? (
              <ScrollArea className="h-[500px] rounded-md border p-4">
                <div className="prose max-w-none" 
                  dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(report) }} 
                />
              </ScrollArea>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>Click "Run Test" to start testing the family creation flow.</p>
                <p className="mt-2 text-sm">This will test authentication, family creation, member invitations, and check for potential constraint violations.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestFamilyFlowPage;
