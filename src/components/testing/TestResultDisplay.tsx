
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle, AlertTriangle, Clock, Loader2 } from "lucide-react";
import { TestResult } from './types';
import { convertMarkdownToHtml } from '@/utils/markdown';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TestResultDisplayProps {
  result: TestResult | null;
  isRunning: boolean;
  testTitle: string;
  testDescription: string;
}

const TestResultDisplay = ({ result, isRunning, testDescription, testTitle }: TestResultDisplayProps) => {
  if (isRunning) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p>Running tests...</p>
      </div>
    );
  }
  
  if (!result) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-4" />
        <p>Click "Run Test" to start the {testTitle.toLowerCase()} test.</p>
        <p className="text-sm mt-2">{testDescription}</p>
      </div>
    );
  }

  // Display status alert before the content
  const StatusAlert = () => {
    if (result.success && !result.hasWarnings) {
      return (
        <Alert className="mb-4 bg-green-50 border-green-500">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-600">Test Completed Successfully</AlertTitle>
          <AlertDescription className="text-green-600">
            All tests passed without errors or warnings.
          </AlertDescription>
        </Alert>
      );
    } else if (result.hasWarnings && result.errorCount === 0) {
      return (
        <Alert className="mb-4 bg-yellow-50 border-yellow-500">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-600">Test Completed with Warnings</AlertTitle>
          <AlertDescription className="text-yellow-600">
            Test completed with {result.warningCount} warning(s). See details below.
          </AlertDescription>
        </Alert>
      );
    } else {
      return (
        <Alert className="mb-4 bg-red-50 border-red-500" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Test Failed</AlertTitle>
          <AlertDescription>
            Test failed with {result.errorCount} error(s). See details below.
          </AlertDescription>
        </Alert>
      );
    }
  };

  return (
    <div className="space-y-4">
      <StatusAlert />
      
      <ScrollArea className="h-[450px] rounded-md border p-4">
        <div 
          className="prose max-w-none" 
          dangerouslySetInnerHTML={{ 
            __html: convertMarkdownToHtml(result.report) 
          }} 
        />
      </ScrollArea>
    </div>
  );
};

export default TestResultDisplay;
