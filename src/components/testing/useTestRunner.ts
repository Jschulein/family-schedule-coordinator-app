
import { useState } from 'react';
import { TestResult, TestResults } from './types';
import { testFamilyCreationFlow } from "@/tests";
import { testFamilyMembersHook, testFamilyMembersPerformance } from "@/tests/useFamilyMembers.test";
import { extractReportStats } from "@/utils/markdown";

export const useTestRunner = () => {
  const [activeTab, setActiveTab] = useState("family-creation");
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResults>({
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
    
    const startTime = performance.now();
    
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
      
      // Extract test statistics using the centralized utility
      const stats = extractReportStats(report);
      
      // Calculate execution time
      const endTime = performance.now();
      const executionTimeMs = Math.round(endTime - startTime);
      
      setResults(prev => ({
        ...prev,
        [testId]: {
          report,
          ...stats,
          executionTimeMs,
          timestamp: new Date().toISOString()
        }
      }));
    } catch (err) {
      console.error('Test error:', err);
      
      // Calculate execution time even for errors
      const endTime = performance.now();
      const executionTimeMs = Math.round(endTime - startTime);
      
      setResults(prev => ({
        ...prev,
        [testId]: {
          report: `Error running test: ${err instanceof Error ? err.message : 'Unknown error'}`,
          success: false,
          hasWarnings: false,
          errorCount: 1,
          warningCount: 0,
          executionTimeMs,
          timestamp: new Date().toISOString()
        }
      }));
    } finally {
      setIsRunning(false);
    }
  };
  
  return {
    activeTab,
    setActiveTab,
    isRunning,
    results,
    runTest
  };
};
