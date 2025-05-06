
import { FamilyServiceResponse } from "@/types/familyTypes";

/**
 * Creates a standardized error response
 * @param message Error message
 * @returns A standardized error response object
 */
export function createErrorResponse<T>(message: string): FamilyServiceResponse<T> {
  return {
    data: null,
    error: message,
    isError: true
  };
}

/**
 * Creates a standardized success response
 * @param data The data to include in the response
 * @param message Optional warning message
 * @returns A standardized success response object
 */
export function createSuccessResponse<T>(data: T, message: string | null = null): FamilyServiceResponse<T> {
  return {
    data,
    error: message,
    isError: false
  };
}
