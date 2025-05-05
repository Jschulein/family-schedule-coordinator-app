
import { useState } from 'react';
import { TestResult, TestResults } from './types';
import { testFamilyCreationFlow } from "@/tests";
import { testFamilyMembersHook, testFamilyMembersPerformance } from "@/tests/useFamilyMembers.test";

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
  
  return {
    activeTab,
    setActiveTab,
    isRunning,
    results,
    runTest
  };
};
