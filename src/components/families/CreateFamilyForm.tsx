
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface CreateFamilyFormProps {
  onSubmit: (name: string) => Promise<void>;
  creating: boolean;
}

export const CreateFamilyForm = ({ onSubmit, creating }: CreateFamilyFormProps) => {
  const [newFamilyName, setNewFamilyName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(newFamilyName);
    setNewFamilyName("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a New Family</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex gap-2" onSubmit={handleSubmit}>
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
        </form>
      </CardContent>
    </Card>
  );
};
