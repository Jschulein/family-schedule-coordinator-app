
# Error Log Document

This document tracks errors found in the application and their solutions. Use this as a reference for troubleshooting recurring issues and preventing regression bugs.

## Table of Contents
- [Authentication Issues](#authentication-issues)
- [Family Management Issues](#family-management-issues)
- [Event Management Issues](#event-management-issues)
- [Type System Issues](#type-system-issues)
- [Navigation Issues](#navigation-issues)
- [UI/UX Issues](#uiux-issues)
- [Performance Issues](#performance-issues)
- [Database and Type Issues](#database-and-type-issues)

## Authentication Issues

### Error: Missing Authentication Route
**Description**: The application attempts to redirect users to `/auth` for login/registration, but this route doesn't exist.
**Solution**: Created a proper Auth page and added it to the router configuration:
```typescript
// In router.tsx
{
  path: "/auth",
  element: <Auth />,
  errorElement: <NotFound />
},
```

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

### Error: Authentication Required for Family Creation
**Description**: When a user tries to create a family without being logged in, they get a cryptic error.
**Solution**: Added proper authentication flow and redirection to the auth page when needed, plus clear error messages:
```typescript
// In CreateFamilyForm.tsx
const { data: { session }, error: authError } = await supabase.auth.getSession();
if (!session || authError) {
  toast({ 
    title: "Authentication required", 
    description: "Please sign in to create a family." 
  });
  navigate("/auth");
  return;
}
```

### Error: Infinite Recursion in RLS Policy
**Description**: The Row Level Security (RLS) policy for the family_members table causes infinite recursion when trying to fetch or manipulate family member data.
**Solution**: Created separate security definer functions to bypass RLS and avoid recursion:
```sql
-- Create a security definer function that bypasses RLS
CREATE OR REPLACE FUNCTION public.safe_is_family_member(p_family_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.family_members 
    WHERE family_id = p_family_id 
    AND user_id = auth.uid()
  );
END;
$$;

-- Use this function in RLS policies instead of directly querying the table
CREATE POLICY "Users can view own family members" 
ON public.family_members
FOR SELECT 
USING (public.safe_is_family_member(family_id));
```

## Event Management Issues

### Error: Infinite Recursion in Events RLS Policy
**Description**: The Row Level Security (RLS) policy for the events table causes infinite recursion due to recursive function calls between user_can_access_event and family member checks.
**Solution**: Created security definer functions that bypass RLS and optimized access checks:
```sql
-- Create optimized security definer function that doesn't cause recursion
CREATE OR REPLACE FUNCTION public.user_can_access_event_safe(event_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    -- Check if user created the event
    SELECT 1
    FROM events e
    WHERE e.id = event_id_param AND e.creator_id = auth.uid()
  ) OR EXISTS (
    -- Check if event is shared with a family the user belongs to
    SELECT 1
    FROM event_families ef
    JOIN family_members fm ON ef.family_id = fm.family_id
    WHERE ef.event_id = event_id_param AND fm.user_id = auth.uid()
  );
END;
$$;

-- Use this function in RLS policies to avoid recursion
CREATE POLICY "Users can view accessible events" 
ON events 
FOR SELECT 
USING (public.user_can_access_event_safe(id));
```

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

## Type System Issues

### Error: Type Mismatch in Toast Action Elements
**Description**: The type mismatch between React.createElement and ToastActionElement caused build errors.
**Solution**: Implemented a dedicated helper module (toast-helpers.tsx) to create properly typed toast actions:
```typescript
// In toast-helpers.tsx
export function createToastAction(
  onClick: () => void,
  altText: string,
  children: React.ReactNode
): ToastActionElement {
  return (
    <ToastAction onClick={onClick} altText={altText}>
      {children}
    </ToastAction>
  ) as ToastActionElement;
}

export function createRetryAction(onRetry: () => void): ToastActionElement {
  return createToastAction(onRetry, "Retry action", "Retry");
}
```

### Error: Type Instantiation Is Excessively Deep
**Description**: Type recursion errors occur in database operation files:
```
error TS2589: Type instantiation is excessively deep and possibly infinite.
```

**Solution**: Break the type recursion by using more direct type assertions:
```typescript
// Before
return {
  data: (data as unknown) as T[],
  error: null,
  status
};

// After - using 'any' to completely break the type chain
return {
  data: (data as any) as T[],
  error: null,
  status
};
```

## Navigation Issues

### Error: Inconsistent Navigation Patterns
**Description**: Some routes use different patterns which can cause navigation issues.
**Solution**: Standardize route patterns across the application, using consistent path structures for all resource operations:
- List view: `/resource`
- Detail view: `/resource/:id`
- Edit view: `/resource/:id/edit`
- Create view: `/resource/new`

### Error: Missing Routes
**Description**: Several routes referenced in the code were missing from the router configuration.
**Solution**: Updated router.tsx to include all necessary routes with proper path patterns:
```typescript
// Added auth route
{
  path: "/auth",
  element: <Auth />,
  errorElement: <NotFound />
},

// Fixed event routes
{
  path: "/events",
  element: <Events />,
},
{
  path: "/events/:eventId/edit", 
  element: <EditEvent />,
},
{
  path: "/event/create",
  element: <NewEvent />,
},
```

## UI/UX Issues

### Error: Inconsistent Toast Notifications
**Description**: Different imports for toast functionality across components.
**Solution**: Standardize toast imports:
```typescript
// Use this consistently
import { toast } from "@/hooks/use-toast";
```

### Error: Missing Authentication Feedback
**Description**: Users weren't properly informed when they needed to be authenticated.
**Solution**: Added clear UI indicators and feedback for authentication requirements:
- Added AuthForm component with toggle between login and signup
- Added proper error messaging for authentication failures
- Implemented automatic redirects to/from auth page based on session state

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

### Error: Family Member Fetching Performance
**Description**: Family member fetching causes performance bottlenecks, especially with large families.
**Solution**: Implement batch loading and caching for family members:
```typescript
// In useFamilyMembers.ts
const fetchFamilyMembersWithBatching = async (familyIds: string[]) => {
  // Use a map to store results by family ID for quick access
  const resultsMap: Record<string, FamilyMember[]> = {};
  
  // Process in batches of 5 to avoid overloading the database
  const batchSize = 5;
  for (let i = 0; i < familyIds.length; i += batchSize) {
    const batch = familyIds.slice(i, i + batchSize);
    
    // Fetch in parallel for each batch
    const results = await Promise.all(
      batch.map(id => supabase
        .from('family_members')
        .select('*')
        .eq('family_id', id)
      )
    );
    
    // Store results in the map
    results.forEach((result, index) => {
      if (!result.error && result.data) {
        resultsMap[batch[index]] = result.data;
      }
    });
  }
  
  return resultsMap;
};
```

## Database and Type Issues

### Error: TypeScript Error with Function Call Parameters
**Description**: TypeScript errors occur when attempting to call RPC functions due to strict typing constraints:
```
error TS2345: Argument of type 'string' is not assignable to parameter of type '"create_notification" | "delete_user_profile" | "function_exists" | ...
```

**Solution**: Apply more aggressive type assertions to bypass TypeScript's strict function name checks:
```typescript
// Before
const { data, error } = await supabase.rpc(
  functionName as unknown as string, 
  params
);

// After - using 'any' assertion to completely bypass type checking
const { data, error } = await (supabase.rpc as any)(
  functionName,
  params
);
```

### Error: Database Function Return Type Mismatch
**Description**: The `get_user_families` function doesn't match the expected return type structure.
**Solution**: Update the function definition to correctly specify the return structure:
```sql
CREATE OR REPLACE FUNCTION public.get_user_families()
RETURNS TABLE (
  id uuid,
  name text,
  color text,
  created_by uuid,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT f.id, f.name, f.color, f.created_by, f.created_at
  FROM families f
  JOIN family_members fm ON f.id = fm.family_id
  WHERE fm.user_id = auth.uid()
  ORDER BY f.name;
END;
$$;
```

### Error: Inconsistent Safe Function Usage
**Description**: Different functions exist for the same purpose (`is_family_member`, `user_is_family_member`, `safe_is_family_member`), causing confusion and potential bugs.
**Solution**: Standardize on a single approach (preferably `safe_is_family_member`) and update all references:
1. Identify all functions serving the same purpose
2. Use the security definer function consistently
3. Ensure RLS policies reference the correct function

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
   - Use the insights from this log to inform the project backlog
