
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { FamilyRole } from "@/types/familyTypes";
import { inviteFamilyMember } from "@/services/families/simplifiedFamilyService";

export function useInviteMemberForm(
  familyId: string,
  onInviteSent?: () => void
) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<FamilyRole>("member");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !role || !name) {
      toast({ title: "Error", description: "Please fill in all fields" });
      return;
    }

    setLoading(true);
    try {
      const result = await inviteFamilyMember(familyId, email, role, name);

      if (result.isError) {
        throw new Error(result.error);
      }

      toast({ title: "Success", description: "Invitation sent successfully!" });
      setEmail("");
      setName("");
      
      if (onInviteSent) {
        onInviteSent();
      }
    } catch (error: any) {
      console.error("Error sending invitation:", error);
      toast({ title: "Error", description: error.message || "Failed to send invitation" });
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    name,
    setName,
    role,
    setRole,
    loading,
    handleSubmit
  };
}
