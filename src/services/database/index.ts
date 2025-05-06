
/**
 * Centralized database service for clean and consistent Supabase interactions
 */

// Export core operations with namespaces to avoid name conflicts
import * as ops from "./operations";
import * as fn from "./functions";
import * as authService from "./auth";
import * as typeDefinitions from "./types";

// Named exports to avoid ambiguity
export const {
  fetchData,
  fetchById,
  insertRecord,
  updateRecord,
  deleteRecord
} = ops;

export const {
  callFunction,
  checkFunctionExists
} = fn;

export const {
  checkAuth,
  getCurrentUserId,
  signOut
} = authService;

// Type exports with explicit names
export type {
  DatabaseResponse,
  QueryOptions
} from "./types";

// Export type definitions without conflicts
export const DbTypes = typeDefinitions;

// Export the simplified database service for new code
export * from "./simpleSupabase";

// Legacy export for backward compatibility
export * as legacyDB from "./databaseService";
