
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface InviteMemberFormProps {
  familyId: string;
  onInviteSent: () => void;
}

export const InviteMemberForm = ({ familyId, onInviteSent }: InviteMemberFormProps) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "member" | "child">("member");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !role || !name) {
      toast({ title: "Error", description: "Please fill in all fields" });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({ title: "Error", description: "You must be logged in to invite members" });
        return;
      }
      
      const { error } = await supabase
        .from("invitations")
        .insert({
          family_id: familyId,
          email,
          name,
          role,
          last_invited: new Date().toISOString(),
          invited_by: user.id
        });

      if (error) throw error;

      toast({ title: "Success", description: "Invitation sent successfully!" });
      setEmail("");
      setName("");
      onInviteSent();
    } catch (error: any) {
      console.error("Error sending invitation:", error);
      toast({ title: "Error", description: error.message || "Failed to send invitation" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          type="text"
          placeholder="Member name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <Select value={role} onValueChange={(value: "admin" | "member" | "child") => setRole(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="child">Child</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : "Send Invitation"}
      </Button>
    </form>
  );
};
