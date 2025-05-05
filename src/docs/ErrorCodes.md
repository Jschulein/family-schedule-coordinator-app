
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

## Authentication Error Codes

| Code         | Description                             | Troubleshooting                                           |
|--------------|-----------------------------------------|-----------------------------------------------------------|
| AUTH001      | Invalid credentials                     | Check username and password                               |
| AUTH002      | Email not verified                      | Resend verification email                                |
| AUTH003      | Session expired                         | Log in again to refresh session                           |
| AUTH004      | User not found                          | Verify user exists in the system                         |
| AUTH005      | Password reset required                 | Follow password reset flow                                |

## API Error Codes

| Code         | Description                             | Troubleshooting                                           |
|--------------|-----------------------------------------|-----------------------------------------------------------|
| API001       | Rate limit exceeded                     | Reduce request frequency                                 |
| API002       | Invalid request format                  | Check request payload format                             |
| API003       | Missing required parameters             | Ensure all required parameters are provided               |
| API004       | Endpoint not found                      | Verify endpoint URL                                      |
| API005       | Service unavailable                     | Try again later or check service status                   |

## Form Validation Errors

| Field        | Error                                   | Resolution                                               |
|--------------|-----------------------------------------|----------------------------------------------------------|
| name         | Name too short                          | Enter at least 3 characters                              |
| email        | Invalid email format                    | Enter a valid email address                              |
| password     | Password too weak                       | Use a stronger password with numbers and symbols          |
| date         | Invalid date format                     | Use YYYY-MM-DD format                                    |
| time         | Invalid time format                     | Use HH:MM format                                         |

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

## How to Report Issues

When reporting issues to the development team, please include:

1. Error code or message (exact text)
2. Steps to reproduce the issue
3. Expected behavior
4. Actual behavior
5. Screenshots if applicable
6. Browser and device information

Report issues through the application feedback form or by contacting support at support@familycalendar.app.
