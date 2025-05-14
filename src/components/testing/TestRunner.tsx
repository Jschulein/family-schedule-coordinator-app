
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { TestResultDisplay } from './TestResultDisplay';
import { TestTabContent } from './TestTabContent';
import { useTestRunner } from './useTestRunner';
import { testFamilyCreation, runEventTests } from '@/tests';

export function TestRunner() {
  const [activeTab, setActiveTab] = useState<string>('family');
  
  // Family tests
  const {
    runTest: runFamilyTest,
    results: familyResults,
    isLoading: isFamilyLoading
  } = useTestRunner(testFamilyCreation);

  // Event tests
  const {
    runTest: runEventTest,
    results: eventResults,
    isLoading: isEventLoading
  } = useTestRunner(runEventTests);

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
                    onClick={runFamilyTest} 
                    disabled={isFamilyLoading}
                    className="ml-2"
                  >
                    {isFamilyLoading ? (
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
                    onClick={runEventTest} 
                    disabled={isEventLoading}
                    className="ml-2"
                  >
                    {isEventLoading ? (
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
              <TestTabContent>
                {familyResults ? (
                  <TestResultDisplay 
                    title="Family Creation Tests"
                    report={familyResults.report}
                    data={familyResults}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Run the tests to see results
                  </div>
                )}
              </TestTabContent>
            </TabsContent>
            
            <TabsContent value="events">
              <TestTabContent>
                {eventResults ? (
                  <TestResultDisplay 
                    title="Event Creation Tests"
                    report={eventResults.report}
                    data={eventResults}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Run the tests to see results
                  </div>
                )}
              </TestTabContent>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
