
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { FamilyRole } from "@/types/familyTypes";
import { useInviteMemberForm } from "@/hooks/useInviteMemberForm";

interface InviteMemberFormProps {
  familyId: string;
  onInviteSent: () => void;
}

export const InviteMemberForm = ({ familyId, onInviteSent }: InviteMemberFormProps) => {
  const {
    email,
    setEmail,
    name,
    setName,
    role,
    setRole,
    loading,
    handleSubmit
  } = useInviteMemberForm(familyId, onInviteSent);

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
        <Select value={role} onValueChange={(value: FamilyRole) => setRole(value)}>
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
