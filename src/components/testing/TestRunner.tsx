
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTestRunner } from './useTestRunner';
import { getTestConfig } from './TestConfigProvider';
import TestTabContent from './TestTabContent';

const TestRunner = () => {
  const { activeTab, setActiveTab, isRunning, results, runTest } = useTestRunner();
  
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
          <TestTabContent 
            testId={activeTab}
            title={getTestConfig(activeTab).title}
            description={getTestConfig(activeTab).description}
            result={results[activeTab]}
            isRunning={isRunning}
            onRunTest={runTest}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestRunner;
