
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FamilyRole } from "@/types/familyTypes";
import { FamilyFormValues } from "./validationSchema";
import { performanceTracker } from "@/utils/testing";

/**
 * Hook for managing family members in the form
 */
export function useFamilyMembers(form: UseFormReturn<FamilyFormValues>) {
  const { setValue, watch } = form;
  const members = watch("members") || [];

  /**
   * Adds a new member to the form
   */
  const addMember = () => {
    // Performance tracking
    const trackingId = performanceTracker.startMeasure('addFamilyMember');
    
    setValue("members", [...members, { name: "", email: "", role: "member" as FamilyRole }]);
    
    performanceTracker.endMeasure(trackingId);
  };

  /**
   * Removes a member from the form
   * @param index Index of the member to remove
   */
  const removeMember = (index: number) => {
    const updatedMembers = [...members];
    updatedMembers.splice(index, 1);
    setValue("members", updatedMembers);
  };

  return {
    members,
    addMember,
    removeMember
  };
}
