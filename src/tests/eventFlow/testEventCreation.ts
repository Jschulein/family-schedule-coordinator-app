
/**
 * Test suite for event creation
 * Tests the core event creation functionality
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
      all_day: false
    };
    
    testLogger.info('EVENT_CREATE', 'Creating test event', testEvent);
    
    // Attempt to create the event
    const { event, error } = await simpleAddEvent(testEvent);
    
    if (error) {
      testLogger.error('EVENT_CREATE', 'Failed to create event', { error });
      return false;
    }
    
    if (!event || !event.id) {
      testLogger.error('EVENT_CREATE', 'Event created but no ID returned');
      return false;
    }
    
    testLogger.success('EVENT_CREATE', 'Event created successfully', {
      eventId: event.id,
      eventName: event.name
    });
    
    // Verify the event exists in the database
    const { data: fetchedEvent, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', event.id)
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
