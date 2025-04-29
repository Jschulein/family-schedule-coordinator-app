
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { testFamilyCreationFlow } from "@/tests/familyCreationFlow";

const TestFamilyFlowPage = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const runTest = async () => {
    setIsRunning(true);
    setReport(null);
    setError(null);
    
    try {
      const result = await testFamilyCreationFlow();
      setReport(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Test error:', err);
    } finally {
      setIsRunning(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Family Creation Flow Test</h1>
          <Button 
            onClick={runTest} 
            disabled={isRunning}
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
        
        {report && !error && (
          <Alert className="mb-6 bg-green-50 border-green-500">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">Test Completed</AlertTitle>
            <AlertDescription className="text-green-600">
              The test has completed. See the detailed report below.
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/**
 * Simple markdown to HTML converter for our specific needs
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

export default TestFamilyFlowPage;
