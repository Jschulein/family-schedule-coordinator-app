
import { Family } from "@/types/familyTypes";
import { FamilyServiceResponse } from "../types";

/**
 * Creates a success response object
 * @param family The family data
 * @param errorMessage Optional warning message
 * @returns A success response object
 */
export function createSuccessResponse(
  family: Family, 
  errorMessage?: string
): FamilyServiceResponse<Family> {
  return {
    data: family,
    error: errorMessage || null,
    isError: false
  };
}

/**
 * Creates an error response object
 * @param errorMessage The error message
 * @returns An error response object
 */
export function createErrorResponse(
  errorMessage: string
): FamilyServiceResponse<Family> {
  return {
    data: null,
    error: errorMessage,
    isError: true
  };
}

/**
 * Handles database constraint violations during family creation
 * @param error The error object
 * @param family Partial family data (if available)
 * @returns An error response
 */
export function handleConstraintViolation(
  error: any
): FamilyServiceResponse<Family> {
  console.error("Database constraint violation:", error);
  return createErrorResponse(`Error creating family: ${error.message}`);
}
