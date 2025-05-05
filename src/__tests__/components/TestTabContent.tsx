
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TestResult } from '../types';
import TestStatusBadge from './TestStatusBadge';
import TestResultDisplay from './TestResultDisplay';

interface TestTabContentProps {
  testId: string;
  title: string;
  description: string;
  result: TestResult | null;
  isRunning: boolean;
  onRunTest: (testId: string) => void;
}

const TestTabContent = ({ 
  testId, 
  title, 
  description, 
  result, 
  isRunning, 
  onRunTest 
}: TestTabContentProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button 
            onClick={() => onRunTest(testId)} 
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
          <TestStatusBadge result={result} />
        </div>
        
        <TestResultDisplay 
          result={result} 
          isRunning={isRunning} 
          testTitle={title} 
          testDescription={description} 
        />
      </CardContent>
    </Card>
  );
};

export default TestTabContent;
