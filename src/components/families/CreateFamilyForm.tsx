
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface CreateFamilyFormProps {
  onSubmit: (name: string) => Promise<unknown>; // Already updated to accept any Promise return type
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
      return;
    }
    
    try {
      await onSubmit(newFamilyName);
      setNewFamilyName("");
    } catch (err) {
      console.error("Error in form submission:", err);
      setError("Failed to create family. Please try again.");
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
