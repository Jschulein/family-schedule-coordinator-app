
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { TestResultDisplay } from './TestResultDisplay';
import { TestTabContent } from './TestTabContent';
import { useTestRunner } from './useTestRunner';
import { testFamilyCreationFlow } from '@/tests/familyFlow';
import { runEventTests } from '@/tests/eventFlow';

export function TestRunner() {
  const [activeTab, setActiveTab] = useState<string>('family');
  
  // Family tests
  const familyTestRunner = useTestRunner();
  const eventTestRunner = useTestRunner();

  // Handle running the family tests
  const handleRunFamilyTest = () => {
    familyTestRunner.runTest('family-creation');
  };

  // Handle running the event tests
  const handleRunEventTest = () => {
    eventTestRunner.runTest('events');
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Family Calendar Testing Suite</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="family" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="family">Family Creation Tests</TabsTrigger>
                <TabsTrigger value="events">Event Creation Tests</TabsTrigger>
              </TabsList>
              <div>
                {activeTab === 'family' && (
                  <Button 
                    onClick={handleRunFamilyTest} 
                    disabled={familyTestRunner.isRunning}
                    className="ml-2"
                  >
                    {familyTestRunner.isRunning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Running Family Tests...
                      </>
                    ) : (
                      'Run Family Tests'
                    )}
                  </Button>
                )}
                {activeTab === 'events' && (
                  <Button 
                    onClick={handleRunEventTest} 
                    disabled={eventTestRunner.isRunning}
                    className="ml-2"
                  >
                    {eventTestRunner.isRunning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Running Event Tests...
                      </>
                    ) : (
                      'Run Event Tests'
                    )}
                  </Button>
                )}
              </div>
            </div>
            
            <TabsContent value="family">
              <div>
                {familyTestRunner.results['family-creation'] ? (
                  <TestResultDisplay 
                    testTitle="Family Creation Tests"
                    testDescription="Tests for creating and managing families"
                    result={familyTestRunner.results['family-creation']}
                    isRunning={familyTestRunner.isRunning}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Run the tests to see results
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="events">
              <div>
                {eventTestRunner.results['events'] ? (
                  <TestResultDisplay 
                    testTitle="Event Creation Tests"
                    testDescription="Tests for creating and managing events"
                    result={eventTestRunner.results['events']}
                    isRunning={eventTestRunner.isRunning}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Run the tests to see results
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
