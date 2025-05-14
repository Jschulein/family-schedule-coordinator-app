
import { supabase } from "@/integrations/supabase/client";
import { testLogger } from "@/utils/testLogger";
import { getRandomString } from "@/utils/testing";

/**
 * Test basic event creation directly to the database
 * This bypasses all the complex state management and UI logic
 * to focus solely on the database interaction
 */
export async function testBasicEventCreation() {
  testLogger.info("EventTest", "Starting basic event creation test");
  
  try {
    // Step 1: Verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      testLogger.error("EventTest", "Authentication error", sessionError);
      return { 
        success: false, 
        message: "Authentication error: " + sessionError.message 
      };
    }
    
    if (!session) {
      testLogger.error("EventTest", "No session found - user not authenticated");
      return { 
        success: false, 
        message: "No active session. Please log in first." 
      };
    }
    
    testLogger.success("EventTest", "Authentication verified", {
      userId: session.user.id,
      email: session.user.email
    });
    
    // Step 2: Create a simple test event
    const testEventName = `Test Event ${getRandomString(5)}`;
    const testEvent = {
      name: testEventName,
      date: new Date().toISOString(),
      time: "12:00",
      description: "Test event for debugging",
      creator_id: session.user.id,
      all_day: false
    };
    
    testLogger.info("EventTest", "Attempting to insert event directly", testEvent);
    
    // Insert directly to debug database interaction
    const { data: createdEvent, error: insertError } = await supabase
      .from('events')
      .insert(testEvent)
      .select()
      .single();
      
    if (insertError) {
      testLogger.error("EventTest", "Database insert failed", insertError);
      
      // Check for RLS policy issues
      if (insertError.message.includes('violates row-level security')) {
        testLogger.error("EventTest", "RLS policy violation detected - checking policies");
        
        // Get RLS policies for debugging (admin only)
        const { error: policyError } = await supabase.rpc(
          'function_exists', 
          { function_name: 'user_can_access_event_safe' }
        );
        
        if (policyError) {
          testLogger.warning("EventTest", "Could not check function existence", policyError);
        }
      }
      
      return { 
        success: false, 
        message: "Database error: " + insertError.message 
      };
    }
    
    if (!createdEvent) {
      testLogger.error("EventTest", "No data returned from insertion");
      return { 
        success: false, 
        message: "Event creation succeeded but no data was returned" 
      };
    }
    
    testLogger.success("EventTest", "Event created successfully", createdEvent);
    
    // Step 3: Verify we can read back the event
    const { data: retrievedEvent, error: retrieveError } = await supabase
      .from('events')
      .select('*')
      .eq('id', createdEvent.id)
      .single();
      
    if (retrieveError) {
      testLogger.error("EventTest", "Could not retrieve created event", retrieveError);
      return { 
        success: true, 
        warning: "Event created but could not be retrieved: " + retrieveError.message,
        eventId: createdEvent.id
      };
    }
    
    testLogger.success("EventTest", "Event retrieved successfully", retrievedEvent);
    
    return { 
      success: true, 
      message: "Event created and verified successfully",
      event: retrievedEvent
    };
  } catch (error) {
    testLogger.error("EventTest", "Unexpected error in test", error);
    return { 
      success: false, 
      message: "Unexpected error: " + (error instanceof Error ? error.message : String(error))
    };
  }
}

/**
 * Test family association functionality
 */
export async function testEventWithFamily() {
  testLogger.info("EventTest", "Starting event with family test");
  
  // First create a basic event
  const basicResult = await testBasicEventCreation();
  
  if (!basicResult.success || !basicResult.event) {
    return basicResult;
  }
  
  const eventId = basicResult.event.id;
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { 
        success: false, 
        message: "No active session for family association test" 
      };
    }
    
    // Get user's families for testing
    const { data: families, error: familiesError } = await supabase
      .rpc('get_user_families');
    
    if (familiesError) {
      testLogger.error("EventTest", "Failed to get user families", familiesError);
      return {
        success: false,
        message: "Could not retrieve user families: " + familiesError.message
      };
    }
    
    if (!families || families.length === 0) {
      testLogger.warning("EventTest", "User has no families to associate");
      return {
        success: true,
        warning: "Event created but user has no families to test association"
      };
    }
    
    // Try to associate with the first family
    const familyId = families[0].id;
    testLogger.info("EventTest", `Associating event with family ${familyId}`);
    
    const { error: associationError } = await supabase
      .from('event_families')
      .insert({
        event_id: eventId,
        family_id: familyId,
        shared_by: session.user.id
      });
      
    if (associationError) {
      testLogger.error("EventTest", "Failed to associate event with family", associationError);
      return {
        success: false,
        message: "Event created but family association failed: " + associationError.message
      };
    }
    
    testLogger.success("EventTest", "Event associated with family successfully");
    
    return {
      success: true,
      message: "Event created and associated with family successfully",
      event: basicResult.event,
      familyId
    };
  } catch (error) {
    testLogger.error("EventTest", "Error in family association test", error);
    return { 
      success: false, 
      message: "Error in family test: " + (error instanceof Error ? error.message : String(error))
    };
  }
}

/**
 * Run all event tests sequentially and generate a report
 */
export async function runEventTests() {
  testLogger.clear();
  testLogger.info("EventTest", "Starting event system tests");
  
  const basicResult = await testBasicEventCreation();
  testLogger.info("EventTest", "Basic event creation test result", {
    success: basicResult.success,
    message: basicResult.message
  });
  
  const familyResult = await testEventWithFamily();
  testLogger.info("EventTest", "Event with family test result", {
    success: familyResult.success,
    message: familyResult.message
  });
  
  const report = testLogger.generateReport();
  return {
    basicTest: basicResult,
    familyTest: familyResult,
    report
  };
}
