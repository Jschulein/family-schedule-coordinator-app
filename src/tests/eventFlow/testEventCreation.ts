
/**
 * Test suite for event creation
 * Tests the core event creation functionality using the secure function
 */
import { testLogger } from '@/utils/testLogger';
import { supabase } from '@/integrations/supabase/client';
import { simpleAddEvent } from '@/services/events';

/**
 * Run tests for event creation functionality
 */
export async function testEventCreation() {
  testLogger.info('EVENT_CREATE', 'Starting event creation test');
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      testLogger.error('EVENT_CREATE', 'Could not get authenticated user', userError);
      return false;
    }
    
    testLogger.info('EVENT_CREATE', 'Running test as user', {
      userId: user.id,
      userEmail: user.email
    });
    
    // Check if user has a profile
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
      
    if (profileError) {
      testLogger.error('EVENT_CREATE', 'Error checking user profile', profileError);
      return false;
    }
    
    if (!userProfile) {
      testLogger.info('EVENT_CREATE', 'Creating missing user profile');
      
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: user.user_metadata.full_name || user.email,
          Email: user.email
        });
        
      if (createProfileError) {
        testLogger.error('EVENT_CREATE', 'Failed to create user profile', createProfileError);
        return false;
      }
      
      testLogger.info('EVENT_CREATE', 'User profile created successfully');
    }
    
    // Generate a unique event name using timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '');
    const eventName = `Test Event ${timestamp}`;
    
    // Create a test event
    const testEvent = {
      name: eventName,
      date: new Date(),
      time: '12:00',
      description: 'Test event description',
      creatorId: user.id,
      all_day: false,
      familyMembers: [] // Add required field
    };
    
    testLogger.info('EVENT_CREATE', 'Creating test event', testEvent);
    
    // First check if the secure function exists
    const { data: canCreateEvent, error: funcCheckError } = await supabase.rpc('can_create_event');
    
    if (funcCheckError) {
      testLogger.error('EVENT_CREATE', 'Function check failed, secure creation not available', { error: funcCheckError });
      
      // Try the standard approach as fallback
      const { event, error } = await simpleAddEvent(testEvent);
      
      if (error) {
        testLogger.error('EVENT_CREATE', 'Failed to create event using standard method', { error });
        return false;
      }
      
      testLogger.success('EVENT_CREATE', 'Event created successfully using standard method', {
        eventId: event?.id,
        eventName: event?.name
      });
      
      return !!event;
    }
    
    testLogger.info('EVENT_CREATE', 'Secure event creation is available', { canCreateEvent });
    
    // Create event using the secure function
    const { data: eventId, error: createError } = await supabase.rpc('create_event_securely', {
      p_name: testEvent.name,
      p_date: testEvent.date.toISOString(),
      p_end_date: testEvent.date.toISOString(),
      p_time: testEvent.time,
      p_description: testEvent.description,
      p_creator_id: user.id,
      p_all_day: testEvent.all_day,
      p_family_members: []
    });
    
    if (createError) {
      testLogger.error('EVENT_CREATE', 'Failed to create event with secure function', { error: createError });
      return false;
    }
    
    if (!eventId) {
      testLogger.error('EVENT_CREATE', 'Event created but no ID returned');
      return false;
    }
    
    testLogger.success('EVENT_CREATE', 'Event created successfully with secure function', {
      eventId: eventId
    });
    
    // Verify the event exists in the database
    const { data: fetchedEvent, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();
    
    if (fetchError || !fetchedEvent) {
      testLogger.error('EVENT_CREATE', 'Could not verify event in database', fetchError);
      return false;
    }
    
    testLogger.success('EVENT_CREATE', 'Event verified in database', {
      databaseEvent: fetchedEvent
    });
    
    return true;
  } catch (error) {
    testLogger.error('EVENT_CREATE', 'Unexpected error in event creation test', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}
