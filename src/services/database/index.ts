
/**
 * Centralized database service for clean and consistent Supabase interactions
 */

// Export core operations from the new modular structure
import * as operations from "./operations";
import * as fn from "./functions";
import * as authService from "./auth";
import * as typeDefinitions from "./types";
import * as simplified from "./simplified";

// Named exports to avoid ambiguity
export const {
  fetchData,
  fetchById,
  insertRecord,
  updateRecord,
  deleteRecord
} = operations;

// Explicitly rename exports to avoid conflicts
export const {
  callFunction: callDatabaseFunction,
  checkFunctionExists
} = fn;

export const {
  checkAuth: checkAuthStatus,
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

// Export the simplified database service 
export {
  getData,
  getById,
  insert,
  update,
  remove,
  callFunction as simpleCallFunction,
  checkAuth as simpleCheckAuth
} from simplified;

// Legacy export for backward compatibility
export * as legacyDB from "./databaseService";
