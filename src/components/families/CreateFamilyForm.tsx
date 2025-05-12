
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { checkFamilySystemHealth } from "@/utils/diagnostics/familyHealthCheck";

interface CreateFamilyFormProps {
  onSubmit: (name: string) => Promise<unknown>; 
  creating: boolean;
}

export const CreateFamilyForm = ({ onSubmit, creating }: CreateFamilyFormProps) => {
  const [newFamilyName, setNewFamilyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!newFamilyName.trim()) {
      setError("Family name cannot be empty");
      toast({ title: "Error", description: "Family name cannot be empty", variant: "destructive" });
      return;
    }
    
    try {
      console.log(`Submitting family creation form (attempt ${retryCount + 1}):`, newFamilyName);
      
      // If this isn't the first attempt, do a health check
      if (retryCount > 0) {
        setIsCheckingHealth(true);
        const healthResult = await checkFamilySystemHealth();
        setIsCheckingHealth(false);
        
        if (healthResult.status !== 'healthy') {
          console.warn("Family system health check results:", healthResult);
          
          if (!healthResult.canCreateFamily) {
            setError(`Family creation is currently unavailable: ${healthResult.issues.join(', ')}`);
            toast({ 
              title: "System Issue Detected", 
              description: "The family creation system is currently experiencing issues. Please try again later.", 
              variant: "destructive" 
            });
            return;
          }
        }
      }
      
      // Proceed with family creation
      await onSubmit(newFamilyName);
      setNewFamilyName("");
      setRetryCount(0);
      toast({ title: "Success", description: "Family created successfully!" });
    } catch (err: any) {
      console.error("Error in family creation form submission:", err);
      const errorMessage = err?.message || "Failed to create family. Please try again.";
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
      
      // Implement smart retry capability for transient errors
      if ((errorMessage.includes('recursion') || 
           errorMessage.includes('temporarily unavailable') ||
           errorMessage.includes('policy') ||
           errorMessage.includes('timeout')) && retryCount < 2) {
        
        const nextRetryCount = retryCount + 1;
        setRetryCount(nextRetryCount);
        
        // Show a different message based on retry count
        if (nextRetryCount === 1) {
          toast({
            title: "Retrying",
            description: "Encountered a temporary issue, retrying automatically...",
            variant: "default"
          });
        } else {
          toast({
            title: "Final Retry",
            description: "Making one last attempt to create your family...",
            variant: "default"
          });
        }
        
        // Exponential backoff for retries: 1s, then 2s
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => {
          handleSubmit(e);
        }, delay);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a New Family</CardTitle>
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
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {retryCount > 0 && !error && (
              <Alert className="mt-2">
                <AlertDescription>
                  {`Retry attempt ${retryCount} of 2. If problems persist, please try again later.`}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
