
import React, { useState } from 'react';
import { TestRunner } from "@/tests";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const TestingPage = () => {
  const [isTestingEvent, setIsTestingEvent] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const testSecureEventCreation = async () => {
    setIsTestingEvent(true);
    setTestResult(null);
    
    try {
      // Check if the user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setTestResult({
          success: false,
          message: "You must be logged in to test event creation"
        });
        return;
      }
      
      // Check if the user has a profile
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();
        
      if (profileError) {
        setTestResult({
          success: false,
          message: "Error checking user profile",
          details: profileError
        });
        return;
      }
      
      if (!userProfile) {
        // Create profile if it doesn't exist
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            full_name: session.user.user_metadata.full_name || session.user.email,
            Email: session.user.email
          });
          
        if (createProfileError) {
          setTestResult({
            success: false,
            message: "Failed to create user profile",
            details: createProfileError
          });
          return;
        }
      }
      
      // First check if function exists
      const { data: canCreate, error: funcError } = await supabase.rpc('can_create_event');
      
      if (funcError) {
        setTestResult({
          success: false,
          message: "Secure event creation function is not available",
          details: funcError
        });
        return;
      }
      
      // Generate a test event name
      const testName = `Test Event ${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}`;
      
      // Try to create an event using the secure function
      const { data: eventId, error: createError } = await supabase.rpc('create_event_securely', {
        p_name: testName,
        p_date: new Date().toISOString(),
        p_end_date: new Date().toISOString(),
        p_time: '12:00',
        p_description: 'Test event created via security definer function',
        p_creator_id: session.user.id,
        p_all_day: false,
        p_family_members: null
      });
      
      if (createError) {
        setTestResult({
          success: false,
          message: "Failed to create event using secure function",
          details: createError
        });
        return;
      }
      
      setTestResult({
        success: true,
        message: `Event created successfully with ID: ${eventId}`,
        details: { eventId }
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: "An unexpected error occurred",
        details: error
      });
    } finally {
      setIsTestingEvent(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold">Testing Page</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Secure Event Creation Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Test the secure event creation function that bypasses Row Level Security.
            This can help identify if RLS is causing issues with event creation.
          </p>
          
          <Button 
            onClick={testSecureEventCreation} 
            disabled={isTestingEvent}
          >
            {isTestingEvent ? 'Creating Test Event...' : 'Create Test Event'}
          </Button>
          
          {testResult && (
            <Alert variant={testResult.success ? "default" : "destructive"}>
              {testResult.success ? (
                <Check className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {testResult.success ? "Success" : "Error"}
              </AlertTitle>
              <AlertDescription>
                {testResult.message}
                {testResult.details && (
                  <pre className="mt-2 text-xs whitespace-pre-wrap bg-muted p-2 rounded-md">
                    {JSON.stringify(testResult.details, null, 2)}
                  </pre>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      <TestRunner />
    </div>
  );
};

export default TestingPage;
