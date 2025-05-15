
# Error Codes and Troubleshooting Guide

This document provides a reference for error codes and common issues in the application, along with troubleshooting steps.

## Database Error Codes

| Code   | Description                                  | Troubleshooting                                            |
|--------|----------------------------------------------|-----------------------------------------------------------|
| 23505  | Unique constraint violation                  | Check for duplicate entries in the form                    |
| 23503  | Foreign key constraint violation             | Verify that referenced entities exist                      |
| 23502  | Not null constraint violation                | Ensure all required fields are provided                    |
| 42P01  | Undefined table                              | Check table name in query                                 |
| 42501  | Insufficient privileges                      | Verify RLS policies and user permissions                   |
| 42702  | Column reference is ambiguous                | Use table aliases to clarify column references             |
| 42703  | Column does not exist                        | Check column names in queries                              |
| 42883  | Function does not exist                      | Verify function name and parameters                        |
| 42P02  | Parameter does not exist                     | Check function parameter names                             |
| 23514  | Check constraint violation                   | Verify data meets business rules                           |

## Authentication Error Codes

| Code         | Description                             | Troubleshooting                                           |
|--------------|-----------------------------------------|-----------------------------------------------------------|
| AUTH001      | Invalid credentials                     | Check username and password                               |
| AUTH002      | Email not verified                      | Resend verification email                                |
| AUTH003      | Session expired                         | Log in again to refresh session                           |
| AUTH004      | User not found                          | Verify user exists in the system                         |
| AUTH005      | Password reset required                 | Follow password reset flow                                |
| CAPTCHA001   | CAPTCHA verification failed             | Retry with new CAPTCHA                                    |
| TOKEN001     | JWT token expired                       | Re-authenticate to get a new token                        |
| TOKEN002     | Invalid token signature                 | Re-authenticate with correct credentials                  |
| MFA001       | MFA code invalid                        | Check code and try again                                  |
| SESSION001   | Multiple concurrent sessions detected   | Log out of other sessions                                 |

## API Error Codes

| Code         | Description                             | Troubleshooting                                           |
|--------------|-----------------------------------------|-----------------------------------------------------------|
| API001       | Rate limit exceeded                     | Reduce request frequency                                 |
| API002       | Invalid request format                  | Check request payload format                             |
| API003       | Missing required parameters             | Ensure all required parameters are provided               |
| API004       | Endpoint not found                      | Verify endpoint URL                                      |
| API005       | Service unavailable                     | Try again later or check service status                   |
| API006       | Request timeout                         | Check network connection and retry                        |
| API007       | Response parsing failed                 | Verify the response format                                |
| API008       | Cross-origin request blocked            | Check CORS configuration                                  |
| API009       | Payload too large                       | Reduce request payload size                               |
| API010       | Method not allowed                      | Use correct HTTP method                                   |

## Form Validation Errors

| Field        | Error                                   | Resolution                                               |
|--------------|-----------------------------------------|----------------------------------------------------------|
| name         | Name too short                          | Enter at least 3 characters                              |
| email        | Invalid email format                    | Enter a valid email address                              |
| password     | Password too weak                       | Use a stronger password with numbers and symbols          |
| date         | Invalid date format                     | Use YYYY-MM-DD format                                    |
| time         | Invalid time format                     | Use HH:MM format                                         |
| role         | Invalid role selection                  | Select from provided role options                         |
| family       | Family name already exists              | Choose a different family name                            |
| description  | Description too long                    | Keep description under character limit                    |
| event_date   | Date cannot be in the past              | Select a future date                                      |
| all_day      | Conflicting time selection              | Remove time selection for all-day events                  |

## Type System Errors

| Error        | Description                             | Resolution                                               |
|--------------|-----------------------------------------|----------------------------------------------------------|
| TS2322       | Type assignment error                   | Ensure value matches expected type                        |
| TS2339       | Property does not exist on type         | Check object properties or add type declaration          |
| TS2345       | Argument type mismatch                  | Convert argument to expected parameter type              |
| TS2589       | Type instantiation is excessively deep  | Break type recursion with more direct type assertions     |
| TS2531       | Object is possibly null                 | Add null check before access                              |
| TS2532       | Object is possibly undefined            | Add undefined check before access                         |
| TS2741       | Property is missing in type             | Add missing property or use partial type                  |
| TSX001       | JSX element type error                  | Use correct component or element type                     |
| TSX002       | Props validation error                  | Provide all required props                                |
| TSX003       | Children type mismatch                  | Pass valid children types                                 |

## UI Component Errors

| Component    | Error                                   | Resolution                                               |
|--------------|-----------------------------------------|----------------------------------------------------------|
| Calendar     | Date selection out of range             | Select date within allowed range                         |
| Toast        | Action element type mismatch            | Use toast-helpers functions to create actions             |
| Dialog       | Modal doesn't close                     | Check state management in close handler                   |
| Form         | Submit handler called multiple times    | Prevent default event behavior                            |
| Dropdown     | Selected item not displayed             | Verify value and onChange handler                         |
| DatePicker   | Invalid date transformation             | Format date correctly before passing to component         |
| Button       | Click handler not firing                | Check event propagation and handler binding               |
| Input        | Value not updating                      | Ensure controlled component with value and onChange       |
| List         | Missing key prop                        | Add unique key for list items                             |
| Layout       | Content overflow                        | Add proper containment or scrollable areas                |

## Common Issues and Solutions

### Family Creation Issues

1. **Duplicate Family Member Error**
   - **Symptom**: Error with code 23505 when creating a family
   - **Cause**: Attempting to add the same user to a family multiple times
   - **Solution**: Ensure the form prevents duplicate family members before submission

2. **Cannot See Created Family**
   - **Symptom**: Family created successfully but doesn't appear in the list
   - **Cause**: RLS policy preventing access or caching issue
   - **Solution**: Check RLS policies, refresh the page, or verify user permissions

### Event Management Issues

1. **Event Date/Time Display Issues**
   - **Symptom**: Events show incorrect date or time
   - **Cause**: Timezone conversion issues
   - **Solution**: Ensure consistent timezone handling in both client and server

2. **Cannot Edit Events**
   - **Symptom**: Edit button doesn't work or shows errors
   - **Cause**: Permissions issues or missing event data
   - **Solution**: Verify user has permission to edit the event and all required data is loaded

### Authentication Issues

1. **Login Loops**
   - **Symptom**: User keeps getting redirected to login page after logging in
   - **Cause**: Session storage issues or invalid tokens
   - **Solution**: Clear browser cache and cookies, then log in again

2. **Email Verification Problems**
   - **Symptom**: Verification emails not received or links don't work
   - **Cause**: Email delivery issues or expired verification links
   - **Solution**: Check spam folder, request new verification email, or contact support

### Performance Issues

1. **Slow Loading Calendar**
   - **Symptom**: Calendar takes a long time to load
   - **Cause**: Inefficient queries or too many events
   - **Solution**: Implement pagination, optimize queries, or limit date range

2. **UI Freezes When Adding Family Members**
   - **Symptom**: Interface becomes unresponsive when adding multiple family members
   - **Cause**: Synchronous operations blocking the main thread
   - **Solution**: Implement batch processing or asynchronous operations
   
3. **Realtime Connection Issues**
   - **Symptom**: Realtime updates not working or causing performance problems
   - **Cause**: Too many reconnection attempts or inefficient subscription management
   - **Solution**: Implement better connection state management and throttle reconnection attempts

### Database and Type Issues

1. **Recursive RLS Policy Issues**
   - **Symptom**: Database operations fail with recursion errors
   - **Cause**: RLS policies that reference the table they're protecting
   - **Solution**: Use security definer functions to bypass RLS in policy definitions

2. **Type Mismatch in UI Components**
   - **Symptom**: Build errors with TypeScript type mismatches
   - **Cause**: Inconsistent typing between UI components and their expected props
   - **Solution**: Use proper type assertions or create helper utilities like toast-helpers.tsx

3. **Database Function Return Type Issues**
   - **Symptom**: Data format mismatch between database and application
   - **Cause**: Incorrect return type definition in database functions
   - **Solution**: Update function definitions with proper RETURNS clause and match TypeScript types

## How to Report Issues

When reporting issues to the development team, please include:

1. Error code or message (exact text)
2. Steps to reproduce the issue
3. Expected behavior
4. Actual behavior
5. Screenshots if applicable
6. Browser and device information

Report issues through the application feedback form or by contacting support at support@familycalendar.app.

## Recent Improvements

1. **Toast Action Element Creation**
   - Created dedicated toast helper utilities to solve type mismatch issues
   - Standardized toast notification creation across the application
   - Added retry capability to error toasts

2. **Family Member Performance Optimization**
   - Implemented parallel batch loading for family members
   - Added performance metrics in test functions
   - Documented significant performance improvements

3. **RLS Policy Recursion Fix**
   - Created security definer functions to safely check permissions
   - Updated RLS policies to use these functions
   - Fixed infinite recursion issues in database operations
