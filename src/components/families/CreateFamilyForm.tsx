
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface CreateFamilyFormProps {
  onSubmit: (name: string) => Promise<unknown>; 
  creating: boolean;
}

export const CreateFamilyForm = ({ onSubmit, creating }: CreateFamilyFormProps) => {
  const [newFamilyName, setNewFamilyName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!newFamilyName.trim()) {
      setError("Family name cannot be empty");
      toast({ title: "Error", description: "Family name cannot be empty" });
      return;
    }
    
    try {
      console.log("Submitting family creation form:", newFamilyName);
      await onSubmit(newFamilyName);
      setNewFamilyName("");
      toast({ title: "Success", description: "Family created successfully!" });
    } catch (err: any) {
      console.error("Error in family creation form submission:", err);
      const errorMessage = err?.message || "Failed to create family. Please try again.";
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage });
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
                disabled={creating}
                required
                className="flex-1"
              />
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
