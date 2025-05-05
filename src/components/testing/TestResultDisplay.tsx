
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle, AlertTriangle, Clock, Loader2 } from "lucide-react";
import { TestResult } from './types';
import { convertMarkdownToHtml } from '@/utils/markdown';

interface TestResultDisplayProps {
  result: TestResult | null;
  isRunning: boolean;
  testTitle: string;
  testDescription: string;
}

const TestResultDisplay = ({ result, isRunning, testTitle, testDescription }: TestResultDisplayProps) => {
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
        <p>Click "Run Test" to start the {testTitle.toLowerCase()} test.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px] rounded-md border p-4">
      <div 
        className="prose max-w-none" 
        dangerouslySetInnerHTML={{ 
          __html: convertMarkdownToHtml(result.report) 
        }} 
      />
    </ScrollArea>
  );
};

export default TestResultDisplay;
