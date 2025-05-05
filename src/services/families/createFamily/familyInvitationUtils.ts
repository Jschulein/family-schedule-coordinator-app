
import { supabase } from "@/integrations/supabase/client";
import { FamilyRole } from "@/types/familyTypes";

/**
 * Prepares and sends invitations to family members
 * @param familyId The ID of the family to invite members to
 * @param members Array of members to invite
 * @param currentUserEmail Email of the current user to filter out from invitations
 * @returns Results of the invitation operation
 */
export async function sendFamilyInvitations(
  familyId: string,
  members: Array<{ name: string; email: string; role: FamilyRole }>,
  currentUserEmail: string
) {
  if (!members || members.length === 0) {
    console.log("No members to invite");
    return { data: null, error: null };
  }
  
  console.log(`Current user email: ${currentUserEmail}`);
  
  // Filter out any members with the same email as the current user
  const filteredMembers = members.filter(member => 
    member.email.toLowerCase() !== currentUserEmail.toLowerCase()
  );
  
  console.log(`Original members: ${members.length}, Filtered members: ${filteredMembers.length}`);
  
  if (filteredMembers.length === 0) {
    console.log("No members to invite after filtering out current user");
    return { data: null, error: null };
  }
  
  try {
    // Filter out duplicates within the members array
    const uniqueEmails = new Set<string>();
    const uniqueMembers = filteredMembers.filter(member => {
      const email = member.email.toLowerCase();
      const isDuplicate = uniqueEmails.has(email);
      uniqueEmails.add(email);
      return !isDuplicate;
    });
    
    console.log(`After duplicate filtering: ${uniqueMembers.length} members`);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("User authentication failed when sending invitations");
      return { data: null, error: "Authentication failed" };
    }
    
    // Prepare invitation data
    const invitations = uniqueMembers.map(member => ({
      family_id: familyId,
      email: member.email.toLowerCase(), // Normalize email
      name: member.name,
      role: member.role,
      invited_by: user.id,
      last_invited: new Date().toISOString()
    }));
    
    console.log(`Sending ${invitations.length} invitations`);
    
    // Use an upsert operation to avoid constraint errors
    const { data: invitationData, error: invitationError } = await supabase
      .from("invitations")
      .upsert(invitations, { 
        onConflict: 'family_id,email',
        ignoreDuplicates: false // Update if there's a conflict
      })
      .select();
    
    return { data: invitationData, error: invitationError };
  } catch (error) {
    console.error("Exception during invitation creation:", error);
    return { data: null, error };
  }
}
