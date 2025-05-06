
# Family Creation Flow Error Documentation

This document tracks errors found in the family creation flow and their solutions.

## Common Errors

### Authentication Related

1. **Error: "You must be logged in to create a family"**
   - **Cause**: User's session has expired or user is not authenticated
   - **Solution**: Redirect to login page and create proper authentication guards on family creation pages
   - **Implementation**: Added authentication checks in the `createFamily` and `createFamilyWithMembers` functions

2. **Error: "Unauthorized access to family data"**
   - **Cause**: Row-Level Security (RLS) policies preventing access to family data after creation
   - **Solution**: Ensure RLS policies are correctly set for the authenticated user

### Family Creation Related

1. **Error: "No data returned when creating family"**
   - **Cause**: The `safe_create_family` function did not return the expected data
   - **Solution**: Enhanced error handling and logging in the function
   - **Implementation**: Added more detailed error logging to track the function's execution

2. **Error: "duplicate key value violates unique constraint"**
   - **Cause**: Attempting to insert a family member that already exists
   - **Solution**: Added conflict handling with `ON CONFLICT DO NOTHING` in the `safe_create_family` function and improved error handling in the client-side functions
   - **Implementation**: Updated the functions to detect this specific error and continue execution when appropriate
   - **Important**: Increased wait time after constraint violations to ensure database operations complete

### Invitation Related

1. **Error: "Failed to send invitations"**
   - **Cause**: Issues inserting invitation records
   - **Solution**: Better error handling around the invitation process
   - **Implementation**: Added robust error handling in the invitation creation process

2. **Error: "Current user included in invitations"**
   - **Cause**: Attempting to invite the user who is creating the family
   - **Solution**: Filter out the current user from the invitation list
   - **Implementation**: Added filtering based on email address comparison

## Testing Workflow

1. **Login Process**
   - Check if user is already logged in
   - If not, redirect to login page or use test credentials
   - Verify session is active

2. **Family Creation**
   - Validate input parameters (name, members)
   - Submit family creation request
   - Verify response contains expected data

3. **Data Verification**
   - Check families table for new entry
   - Check family_members table for creator's entry
   - Check invitations table for invited members

4. **Error Handling**
   - Document all errors encountered
   - Implement solutions for each error
   - Verify solutions resolve the issues

## Fixed Issues

### Infinite Recursion in RLS Policies

**Error**: 
```
ERROR: infinite recursion detected in policy for relation "family_members"
```

**Cause**:
The RLS policy for the family_members table was recursively calling itself because it was using the `is_family_member` function which itself queried the family_members table.

**Solution**:
Created a new security definer function `safe_is_family_member` that bypasses RLS to avoid the recursion.

### Duplicate Family Member Creation

**Error**:
```
ERROR: duplicate key value violates unique constraint "family_members_family_id_user_id_key"
```

**Cause**:
When creating a family, both the trigger and the direct insertion attempted to add the creator as a family member.

**Solution**:
1. Added conflict handling with `ON CONFLICT DO NOTHING` in the family creation function.
2. Enhanced error handling in client-side functions to detect this specific error and continue execution.
3. Implemented checks to verify if the family was created despite the constraint violation.
4. Increased timeout after error to ensure database operations complete before verification.
