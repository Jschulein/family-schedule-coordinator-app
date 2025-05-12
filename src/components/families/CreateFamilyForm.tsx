
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, AlertCircle, AlertTriangle, Bug } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { checkFamilySystemHealth } from "@/utils/diagnostics/familyHealthCheck";

interface CreateFamilyFormProps {
  onSubmit: (name: string) => Promise<unknown>; 
  creating: boolean;
  retryCount?: number;
  debugMode?: boolean;
}

export const CreateFamilyForm = ({ 
  onSubmit, 
  creating, 
  retryCount = 0,
  debugMode = false
}: CreateFamilyFormProps) => {
  const [newFamilyName, setNewFamilyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  // Check system health on mount or when retry count changes
  useEffect(() => {
    if (retryCount > 0 || debugMode) {
      const checkHealth = async () => {
        setIsCheckingHealth(true);
        try {
          const healthResult = await checkFamilySystemHealth();
          setIsHealthy(healthResult.status === 'healthy');
          
          if (healthResult.status !== 'healthy') {
            console.warn("System health issues detected:", healthResult.issues);
            setError(`System health issues: ${healthResult.issues.join(", ")}`);
          }
        } catch (err) {
          console.error("Error checking health:", err);
          setIsHealthy(false);
        } finally {
          setIsCheckingHealth(false);
        }
      };
      
      checkHealth();
    }
  }, [retryCount, debugMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!newFamilyName.trim()) {
      setError("Family name cannot be empty");
      toast({ title: "Error", description: "Family name cannot be empty", variant: "destructive" });
      return;
    }
    
    try {
      await onSubmit(newFamilyName);
      setNewFamilyName("");
    } catch (err: any) {
      console.error("Error in family creation form submission:", err);
      const errorMessage = err?.message || "Failed to create family. Please try again.";
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a New Family</CardTitle>
        <CardDescription>
          Create a family group to manage shared events and calendars.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <div className="flex gap-2">
              <Input
                placeholder="Family name"
                value={newFamilyName}
                onChange={(e) => setNewFamilyName(e.target.value)}
                disabled={creating || isCheckingHealth}
                required
                className="flex-1"
              />
              <Button type="submit" disabled={creating || isCheckingHealth}>
                {creating || isCheckingHealth ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isCheckingHealth ? "Checking..." : "Creating..."}
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </div>
            
            {error && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {retryCount > 0 && !error && (
              <Alert variant={retryCount > 1 ? "destructive" : "default"} className="mt-2">
                {retryCount > 1 && <AlertTriangle className="h-4 w-4" />}
                <AlertDescription>
                  {`Retry attempt ${retryCount}. ${
                    retryCount > 1 
                      ? "If problems persist, please try again later." 
                      : "Retrying automatically..."
                  }`}
                </AlertDescription>
              </Alert>
            )}
            
            {isHealthy === false && (
              <Alert variant="default" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  System health check failed. The family creation service may be experiencing issues.
                </AlertDescription>
              </Alert>
            )}
            
            {debugMode && (
              <Alert variant="default" className="mt-2 bg-yellow-50 border-yellow-200">
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  Debug mode enabled. Check console for diagnostics information.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
