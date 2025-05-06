
/**
 * Centralized database service for clean and consistent Supabase interactions
 */
export * from "./supabaseService";

// Export the simplified database service as the primary API
export * from "./simpleSupabase";

// Legacy export only for backward compatibility
// Not recommended for new code
export * as legacyDB from "./databaseService";
