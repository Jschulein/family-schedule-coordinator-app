
/**
 * Core database operations index
 * Re-exports all database operation modules
 */

// Re-export modules with namespaced exports
export * as fetch from "./fetch";
export * as insert from "./insert";
export * as update from "./update";
export * as remove from "./remove";

// Re-export common operations for backward compatibility
export { fetchData, fetchById } from "./fetch";
export { insertRecord } from "./insert";
export { updateRecord } from "./update";
export { deleteRecord } from "./remove";
