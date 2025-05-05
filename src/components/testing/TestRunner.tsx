
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { testFamilyCreationFlow } from "@/tests";
import { testFamilyMembersHook, testFamilyMembersPerformance } from "@/tests/useFamilyMembers.test";

// Types for the test runner
interface TestResult {
  report: string;
  success: boolean;
  hasWarnings: boolean;
  errorCount: number;
  warningCount: number;
}

const TestRunner = () => {
  const [activeTab, setActiveTab] = useState("family-creation");
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Record<string, TestResult | null>>({
    "family-creation": null,
    "family-members": null,
    "performance": null
  });
  
  const runTest = async (testId: string) => {
    setIsRunning(true);
    setResults(prev => ({
      ...prev,
      [testId]: null
    }));
    
    try {
      let report: string;
      
      // Run the appropriate test based on the ID
      switch (testId) {
        case "family-creation":
          report = await testFamilyCreationFlow();
          break;
        case "family-members":
          report = await testFamilyMembersHook();
          break;
        case "performance":
          report = await testFamilyMembersPerformance();
          break;
        default:
          throw new Error(`Unknown test ID: ${testId}`);
      }
      
      // Extract test statistics from the report
      const errorCount = parseInt(report.match(/Errors:\*\* (\d+)/)?.[1] || '0', 10);
      const warningCount = parseInt(report.match(/Warnings:\*\* (\d+)/)?.[1] || '0', 10);
      
      setResults(prev => ({
        ...prev,
        [testId]: {
          report,
          success: errorCount === 0,
          hasWarnings: warningCount > 0,
          errorCount,
          warningCount
        }
      }));
    } catch (err) {
      console.error('Test error:', err);
      setResults(prev => ({
        ...prev,
        [testId]: {
          report: `Error running test: ${err instanceof Error ? err.message : 'Unknown error'}`,
          success: false,
          hasWarnings: false,
          errorCount: 1,
          warningCount: 0
        }
      }));
    } finally {
      setIsRunning(false);
    }
  };
  
  const getTestConfig = (testId: string) => {
    switch (testId) {
      case "family-creation":
        return {
          title: "Family Creation Flow",
          description: "Tests the complete family creation flow from authentication to member registration"
        };
      case "family-members":
        return {
          title: "Family Members",
          description: "Tests the family members hook and data fetching functionality"
        };
      case "performance":
        return {
          title: "Performance Metrics",
          description: "Measures and compares performance of different data fetching strategies"
        };
      default:
        return {
          title: "Unknown Test",
          description: "No description available"
        };
    }
  };
  
  const getResultIcon = (result: TestResult | null) => {
    if (!result) return <Clock className="h-5 w-5 text-gray-400" />;
    
    if (result.success) {
      return result.hasWarnings ? 
        <AlertTriangle className="h-5 w-5 text-yellow-500" /> : 
        <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    
    return <AlertCircle className="h-5 w-5 text-red-500" />;
  };
  
  const getResultLabel = (result: TestResult | null) => {
    if (!result) return "Not Run";
    
    if (result.success) {
      return result.hasWarnings ? 
        `Passed with ${result.warningCount} warnings` : 
        "Passed";
    }
    
    return `Failed with ${result.errorCount} errors`;
  };
  
  const currentTestConfig = getTestConfig(activeTab);
  const currentResult = results[activeTab];
  
  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6">Test Runner</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 lg:w-2/3">
          <TabsTrigger value="family-creation" disabled={isRunning}>
            Family Creation
          </TabsTrigger>
          <TabsTrigger value="family-members" disabled={isRunning}>
            Family Members
          </TabsTrigger>
          <TabsTrigger value="performance" disabled={isRunning}>
            Performance
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{currentTestConfig.title}</CardTitle>
                  <CardDescription>{currentTestConfig.description}</CardDescription>
                </div>
                <Button 
                  onClick={() => runTest(activeTab)} 
                  disabled={isRunning}
                  className="min-w-[120px]"
                >
                  {isRunning ? "Running..." : "Run Test"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center space-x-2">
                <span className="font-semibold">Status:</span>
                <div className="flex items-center space-x-1">
                  {getResultIcon(currentResult)}
                  <span>{getResultLabel(currentResult)}</span>
                </div>
              </div>
              
              {currentResult ? (
                <ScrollArea className="h-[500px] rounded-md border p-4">
                  <div 
                    className="prose max-w-none" 
                    dangerouslySetInnerHTML={{ 
                      __html: convertMarkdownToHtml(currentResult.report) 
                    }} 
                  />
                </ScrollArea>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p>Click "Run Test" to start the {currentTestConfig.title.toLowerCase()} test.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

/**
 * Simple markdown to HTML converter for rendering test reports
 */
function convertMarkdownToHtml(markdown: string): string {
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Lists
    .replace(/^\- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n)+/g, '<ul>$&</ul>')
    // Bold
    .replace(/\*\*(.*)\*\*/gm, '<strong>$1</strong>')
    // Code blocks
    .replace(/```json\n([\s\S]*?)```/gm, '<pre><code class="language-json">$1</code></pre>')
    // Line breaks
    .replace(/\n/gm, '<br />');
  
  return html;
}

export default TestRunner;
