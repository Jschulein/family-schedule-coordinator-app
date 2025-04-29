
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { Control } from "react-hook-form";
import { FamilyFormValues } from "@/hooks/useCreateFamilyForm";

interface FamilyMemberFormItemProps {
  index: number;
  control: Control<FamilyFormValues>;
  onRemove: (index: number) => void;
}

export const FamilyMemberFormItem = ({ 
  index,
  control,
  onRemove
}: FamilyMemberFormItemProps) => {
  return (
    <div className="border rounded-lg p-4 space-y-3 relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2"
        onClick={() => onRemove(index)}
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
  );
};
