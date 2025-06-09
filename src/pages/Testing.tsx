
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

export default function Testing() {
  const { user, isSessionReady } = useAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSessionReady && user) {
      runBasicTests();
    }
  }, [isSessionReady, user]);

  const runBasicTests = async () => {
    setLoading(true);
    const results: any[] = [];

    try {
      // Test 1: Check if user profile exists
      results.push(await testUserProfile());
      
      // Test 2: Test database connection
      results.push(await testDatabaseConnection());
      
      // Test 3: Test RPC functions
      results.push(await testRPCFunctions());

      setTestResults(results);
    } catch (error) {
      console.error("Error running tests:", error);
      toast({
        title: "Test Error",
        description: "Failed to run some tests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testUserProfile = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) {
        return {
          name: "User Profile Check",
          status: "failed",
          message: error.message,
          details: error
        };
      }

      if (!data) {
        // Try to create profile
        const { error: createError } = await (supabase as any)
          .from('profiles')
          .insert({
            id: user?.id,
            full_name: user?.user_metadata?.full_name || user?.email,
            Email: user?.email
          });

        if (createError) {
          return {
            name: "User Profile Creation",
            status: "failed",
            message: createError.message,
            details: createError
          };
        }

        return {
          name: "User Profile Check",
          status: "success",
          message: "Profile created successfully",
          details: { created: true }
        };
      }

      return {
        name: "User Profile Check",
        status: "success",
        message: "Profile exists",
        details: data
      };
    } catch (error: any) {
      return {
        name: "User Profile Check",
        status: "failed",
        message: error.message,
        details: error
      };
    }
  };

  const testDatabaseConnection = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('families')
        .select('count')
        .limit(1);

      return {
        name: "Database Connection",
        status: error ? "failed" : "success",
        message: error ? error.message : "Connection successful",
        details: { data, error }
      };
    } catch (error: any) {
      return {
        name: "Database Connection",
        status: "failed",
        message: error.message,
        details: error
      };
    }
  };

  const testRPCFunctions = async () => {
    try {
      const { data, error } = await (supabase.rpc as any)('can_create_event');

      return {
        name: "RPC Functions Test",
        status: error ? "failed" : "success",
        message: error ? error.message : "RPC functions working",
        details: { data, error }
      };
    } catch (error: any) {
      return {
        name: "RPC Functions Test",
        status: "failed",
        message: error.message,
        details: error
      };
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Testing Dashboard</h1>
          <p className="text-muted-foreground">System health and diagnostics</p>
        </div>
        <Button onClick={runBasicTests} disabled={loading}>
          {loading ? "Running Tests..." : "Run Tests"}
        </Button>
      </div>

      <div className="grid gap-6">
        {testResults.map((result, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{result.name}</CardTitle>
                <Badge variant={result.status === "success" ? "default" : "destructive"}>
                  {result.status}
                </Badge>
              </div>
              <CardDescription>{result.message}</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded overflow-auto">
                {JSON.stringify(result.details, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>

      {testResults.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No test results yet. Click "Run Tests" to start.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
