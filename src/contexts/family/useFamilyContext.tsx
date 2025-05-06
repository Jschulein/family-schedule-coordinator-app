
import { useContext } from "react";
import { FamilyContext } from "./FamilyContext";

export const useFamilyContext = () => {
  const context = useContext(FamilyContext);
  
  if (!context) {
    throw new Error('useFamilyContext must be used within a FamilyProvider');
  }
  
  return context;
};
