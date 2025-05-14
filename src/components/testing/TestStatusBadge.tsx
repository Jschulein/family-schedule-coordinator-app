
import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { TestResult } from './types';

interface TestStatusBadgeProps {
  result: TestResult | null;
}

export const TestStatusBadge = ({ result }: TestStatusBadgeProps) => {
  if (!result) {
    return (
      <div className="flex items-center space-x-1">
        <Clock className="h-5 w-5 text-gray-400" />
        <span>Not Run</span>
      </div>
    );
  }
  
  if (result.success) {
    if (result.hasWarnings) {
      return (
        <div className="flex items-center space-x-1">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <span>Passed with {result.warningCount} warnings</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center space-x-1">
        <CheckCircle className="h-5 w-5 text-green-500" />
        <span>Passed</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center space-x-1">
      <AlertCircle className="h-5 w-5 text-red-500" />
      <span>Failed with {result.errorCount} errors</span>
    </div>
  );
};
