
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, PlusCircle, UserPlus, AlertCircle, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FamilyMemberFormItem } from "./FamilyMemberFormItem";
import { useCreateFamilyForm } from "@/hooks/family-form";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateFamilyWithMembersFormProps {
  onSuccess: () => void;
  debugMode?: boolean;
}

export const CreateFamilyWithMembersForm = ({ 
  onSuccess,
  debugMode = false
}: CreateFamilyWithMembersFormProps) => {
  const { 
    form, 
    loading, 
    members, 
    errorMessage,
    addMember, 
    removeMember, 
    onSubmit 
  } = useCreateFamilyForm({ onSuccess });

  const { control } = form;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create a New Family</CardTitle>
        <CardDescription>
          Create a family and invite members to join
        </CardDescription>
      </CardHeader>
      <CardContent>
        {debugMode && (
          <Alert variant="default" className="mb-4 bg-yellow-50 border-yellow-200">
            <Bug className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              Debug mode enabled. Additional diagnostics information will be logged to console.
            </AlertDescription>
          </Alert>
        )}
        
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-6">
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Family Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Smith Family" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {members.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-md font-medium flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite Family Members
                </h3>
                
                {members.map((_, index) => (
                  <FamilyMemberFormItem
                    key={index}
                    index={index}
                    control={control}
                    onRemove={removeMember}
                  />
                ))}
              </div>
            )}

            <div className="flex flex-col space-y-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={addMember}
                className="flex items-center justify-center"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Family Member
              </Button>
              
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Family...
                  </>
                ) : "Create Family"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
