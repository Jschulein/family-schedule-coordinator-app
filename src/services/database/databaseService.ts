
/**
 * Re-export of legacy database service
 * This file is maintained for backward compatibility only.
 * New code should use the more focused and type-safe modules directly.
 */
import { checkAuth, getCurrentUserId, signOut } from './auth';
import { 
  fetchData, 
  fetchById, 
  insertRecord, 
  updateRecord, 
  deleteRecord 
} from './operations';
import { callFunction, checkFunctionExists } from './functions';

// Re-export everything for backward compatibility
export { 
  checkAuth,
  getCurrentUserId,
  signOut,
  fetchData,
  fetchById,
  insertRecord,
  updateRecord,
  deleteRecord,
  callFunction,
  checkFunctionExists
};

// Legacy naming scheme for backward compatibility
export const createErrorResponse = (message: string): { error: string; status: number } => ({
  error: message,
  status: 400
});
