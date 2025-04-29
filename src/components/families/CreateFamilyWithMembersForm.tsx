
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlusCircle, X, UserPlus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";

// Define validation schema
const familyFormSchema = z.object({
  name: z.string().min(2, { message: "Family name must be at least 2 characters." }),
  members: z.array(
    z.object({
      name: z.string().min(2, { message: "Member name must be at least 2 characters." }),
      email: z.string().email({ message: "Please enter a valid email address." }),
      role: z.enum(["admin", "member", "child"], { 
        message: "Please select a valid role." 
      })
    })
  ).optional()
});

type FamilyFormValues = z.infer<typeof familyFormSchema>;

interface CreateFamilyWithMembersFormProps {
  onSuccess: () => void;
}

export const CreateFamilyWithMembersForm = ({ onSuccess }: CreateFamilyWithMembersFormProps) => {
  const [loading, setLoading] = useState(false);
  
  // Initialize form with react-hook-form
  const form = useForm<FamilyFormValues>({
    resolver: zodResolver(familyFormSchema),
    defaultValues: {
      name: "",
      members: []
    }
  });

  const { control, handleSubmit, formState: { errors }, watch, setValue } = form;
  const members = watch("members") || [];

  const addMember = () => {
    setValue("members", [...members, { name: "", email: "", role: "member" }]);
  };

  const removeMember = (index: number) => {
    const updatedMembers = [...members];
    updatedMembers.splice(index, 1);
    setValue("members", updatedMembers);
  };

  const onSubmit = async (data: FamilyFormValues) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({ title: "Error", description: "You must be logged in to create a family" });
        setLoading(false);
        return;
      }

      console.log("Creating new family:", data.name);
      
      // Create the family first
      const { data: familyData, error: familyError } = await supabase
        .from("families")
        .insert({ name: data.name, created_by: user.id })
        .select("id, name")
        .single();

      if (familyError) {
        console.error("Error creating family:", familyError);
        throw familyError;
      }
      
      if (!familyData) {
        throw new Error("No data returned when creating family");
      }
      
      console.log("Family created successfully:", familyData);
      toast({ title: "Success", description: "Family created successfully!" });
      
      // Now send invitations to all members if any were added
      if (data.members && data.members.length > 0) {
        console.log(`Inviting ${data.members.length} members to family`);
        
        const invitations = data.members.map(member => ({
          family_id: familyData.id,
          email: member.email,
          name: member.name,
          role: member.role,
          invited_by: user.id,
          last_invited: new Date().toISOString()
        }));
        
        const { error: invitationError } = await supabase
          .from("invitations")
          .insert(invitations);
        
        if (invitationError) {
          console.error("Error sending invitations:", invitationError);
          toast({ 
            title: "Warning", 
            description: "Family created but there was an error inviting some members." 
          });
        } else {
          toast({ 
            title: "Success", 
            description: `Family created and ${invitations.length} members invited!` 
          });
        }
      }
      
      // Call the onSuccess callback to refresh data
      onSuccess();
      
      // Reset the form
      form.reset();
      
    } catch (error: any) {
      console.error("Error in family creation form submission:", error);
      const errorMessage = error?.message || "Failed to create family. Please try again.";
      toast({ title: "Error", description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a New Family</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                
                {members.map((member, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3 relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => removeMember(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    
                    <FormField
                      control={control}
                      name={`members.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={control}
                      name={`members.${index}.email`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={control}
                      name={`members.${index}.role`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select 
                            value={field.value} 
                            onValueChange={(value: "admin" | "member" | "child") => field.onChange(value)}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="child">Child</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
