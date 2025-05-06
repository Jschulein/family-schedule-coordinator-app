
/**
 * Centralized database service for clean and consistent Supabase interactions
 */

// Core database operations
export * from "./operations";
export * from "./functions";
export * from "./auth";
export * from "./types";

// Export the simplified database service for new code
export * from "./simpleSupabase";

// Legacy export for backward compatibility
export * as legacyDB from "./databaseService";
