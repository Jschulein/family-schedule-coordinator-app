
/**
 * Database-specific error handling utilities
 */

/**
 * Formats database errors into user-friendly messages
 * @param error The database error
 * @returns A user-friendly error message
 */
export function formatDatabaseError(error: any): string {
  // Check for common Supabase/PostgreSQL error codes
  if (error.code) {
    switch (error.code) {
      case '23505': 
        return 'A record with this information already exists.';
      case '23503': 
        return 'This action references data that doesn\'t exist.';
      case '23502': 
        return 'Required information is missing.';
      case '42P01': 
        return 'The requested data resource doesn\'t exist.';
      case '42501':
        return 'You don\'t have permission to perform this action.';
      // Add more error codes as needed
      default:
        break;
    }
  }
  
  // Handle specific supabase-js errors
  if (error.message) {
    if (error.message.includes('JWT')) {
      return 'Your session has expired. Please log in again.';
    }
    
    // Return the original message if we can't find a better one
    return error.message;
  }
  
  return 'An error occurred while accessing the database.';
}
