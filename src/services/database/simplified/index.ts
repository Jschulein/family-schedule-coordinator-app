
/**
 * Simplified Supabase database service
 * Using direct, type-safe approaches to interact with Supabase
 * 
 * This index file re-exports all functionality from the simplified modules
 */

// Export types and helper functions
export * from "./types";

// Export authentication functions
export { checkAuth } from "./auth";

// Export query functions
export { getData, getById } from "./queries";

// Export mutation functions
export { insert, update, remove } from "./mutations";

// Export function calling utilities
export { callFunction } from "./functions";
