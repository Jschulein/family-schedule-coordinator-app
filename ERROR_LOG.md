
# Error Log Document

This document tracks errors found in the application and their solutions. Use this as a reference for troubleshooting recurring issues and preventing regression bugs.

## Table of Contents
- [Authentication Issues](#authentication-issues)
- [Family Management Issues](#family-management-issues)
- [Event Management Issues](#event-management-issues)
- [Navigation Issues](#navigation-issues)
- [UI/UX Issues](#uiux-issues)
- [Performance Issues](#performance-issues)

## Authentication Issues

### Error: Authentication Redirect Loop
**Description**: Users may experience redirect loops during authentication if site URLs are not configured properly in Supabase.
**Solution**: Configure Site URL and Redirect URLs in Supabase under Authentication > URL Configuration.

### Error: Session Persistence Issues
**Description**: Users may be unexpectedly logged out or authentication state may not persist between page refreshes.
**Solution**: Ensure proper session handling with Supabase auth:
```typescript
// In authentication context
useEffect(() => {
  // Set up auth state listener FIRST
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    }
  );

  // THEN check for existing session
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);
  });

  return () => subscription.unsubscribe();
}, []);
```

## Family Management Issues

### Error: Family Creation Failure
**Description**: Creating a family fails silently when validation errors occur.
**Solution**: Implement proper error handling and validation:
```typescript
// Enhanced error handling in createFamilyHandler
try {
  const result = await createFamilyService(name);
  
  if (result.isError) {
    setError(result.error || "Failed to create family");
    toast({ title: "Error", description: result.error || "Failed to create family" });
    return;
  }
  // Success handling
} catch (error) {
  console.error("Detailed error:", error);
  // Error handling
}
```

### Error: Duplicate Family Creation Services
**Description**: Multiple implementations of the `createFamily` function exist in the codebase (`familyMutations.ts` and `families/createFamily.ts`), which could cause inconsistency and maintenance issues.
**Solution**: Consolidate the family creation logic into a single service:
1. Remove `familyMutations.ts` entirely
2. Ensure all components import from `families/index.ts`
3. Update any existing imports to use the consolidated services

### Error: Duplicate Family Member Creation
**Description**: When creating a family, the application attempts to add the same user as a family member multiple times, violating the unique constraint on family_id and user_id.
**Solution**: Implement uniqueness check before inserting family members and handle the conflict gracefully:
```sql
-- In the safe_create_family function:
INSERT INTO public.family_members (family_id, user_id, email, role, name)
VALUES (
  new_family_id,
  p_user_id,
  user_email,
  'admin'::family_role,
  COALESCE(
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = p_user_id),
    user_email
  )
)
ON CONFLICT (family_id, user_id) DO NOTHING; -- Added conflict handling
```

### Error: Family Member Invitation Issues
**Description**: Invitation emails may not be sent or processed correctly.
**Solution**: Verify invitation flow and implement better error feedback:
- Check all SQL functions related to invitations
- Implement status indicators for invitation process
- Add retry mechanisms for failed invitations

## Event Management Issues

### Error: Event Creation Fails Without Feedback
**Description**: Users may submit event forms that fail without clear error messages.
**Solution**: Implement form validation and better error handling:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  setFormError(null);
  
  if (!isFormValid) {
    setFormError("Please fill out all required fields");
    setIsSubmitting(false);
    return;
  }
  
  try {
    // Form submission logic
  } catch (error) {
    console.error("Submission error:", error);
    setFormError(error.message || "Failed to create event");
  } finally {
    setIsSubmitting(false);
  }
};
```

### Error: Event Edit Route Mismatch
**Description**: Navigate URL pattern didn't match route definition.
**Solution**: Updated edit navigation path in EventActions.tsx:
```typescript
navigate(`/events/${event.id}/edit`); // Changed from /event/edit/${event.id}
```

### Error: Event Data Not Found on Edit Page
**Description**: When navigating to edit an event, the event data might not be found.
**Solution**: Added direct database fetching capability when event is not in context:
```typescript
// If not in context, fetch directly from the database
const { event: fetchedEvent, error: fetchError } = await fetchEventById(eventId);
```

### Error: Missing formatEventFromDB Function
**Description**: The `fetchEventById.ts` file tried to import and use a non-existent `formatEventFromDB` function.
**Solution**: Updated the code to use the existing `fromDbEvent` function from `eventFormatter.ts` instead:
```typescript
// Changed import statement
import { fromDbEvent } from "@/utils/eventFormatter";

// Changed function call
const formattedEvent = fromDbEvent({
  ...eventData,
  familyMembers
}, userMap);
```

## Navigation Issues

### Error: Inconsistent Navigation Patterns
**Description**: Some routes use different patterns which can cause navigation issues.
**Solution**: Standardize route patterns across the application, using consistent path structures for all resource operations:
- List view: `/resource`
- Detail view: `/resource/:id`
- Edit view: `/resource/:id/edit`
- Create view: `/resource/new`

## UI/UX Issues

### Error: Inconsistent Toast Notifications
**Description**: Different imports for toast functionality across components.
**Solution**: Standardize toast imports:
```typescript
// Use this consistently
import { toast } from "@/hooks/use-toast";
```

## Performance Issues

### Error: Inefficient Data Querying
**Description**: Fetching all events when only specific events are needed.
**Solution**: Implement query filtering and pagination:
```typescript
// Example implementation for filtered event querying
const fetchFilteredEvents = async (filters) => {
  let query = supabase.from('events').select('*');
  
  if (filters.startDate) {
    query = query.gte('date', filters.startDate);
  }
  
  if (filters.endDate) {
    query = query.lte('date', filters.endDate);
  }
  
  // Add pagination
  if (filters.page && filters.pageSize) {
    const from = (filters.page - 1) * filters.pageSize;
    const to = from + filters.pageSize - 1;
    query = query.range(from, to);
  }
  
  return await query.order('date', { ascending: true });
};
```

---

## How to Use This Error Log

1. **Recording New Issues**:
   - Add detailed error descriptions
   - Note the steps to reproduce
   - Document the solution implemented
   - Include any relevant code snippets or specific files modified

2. **Preventive Measures**:
   - Review this log before making similar changes
   - Implement automated tests for resolved issues
   - Consider creating utility functions for common error-prone operations

3. **Continuous Improvement**:
   - Periodically review this log to identify patterns
   - Refactor components or services that frequently cause issues
   - Update documentation based on recurring problems

