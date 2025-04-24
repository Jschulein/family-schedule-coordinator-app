
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Event } from "@/types/eventTypes";
import EventActions from './EventActions';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

interface SelectedDateEventsProps {
  selectedDate: Date | undefined;
  events: Event[];
  calendarColor: string;
}

const SelectedDateEvents = ({ selectedDate, events, calendarColor }: SelectedDateEventsProps) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const { data } = await supabase.auth.getSession();
      setCurrentUserId(data.session?.user.id || null);
    };
    
    fetchUserId();
  }, []);
  
  const selectedDateEvents = selectedDate
    ? events.filter(
        (event) => format(event.date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
      )
    : [];

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>
          {selectedDate 
            ? `Events on ${format(selectedDate, "MMMM d, yyyy")}`
            : "Select a date to view events"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedDateEvents.length > 0 ? (
          <div className="space-y-4">
            {selectedDateEvents.map((event, index) => (
              <div key={index} className="border-b last:border-0 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" style={{ borderColor: calendarColor }}>
                      {event.familyMember}
                    </Badge>
                    <span className="font-medium">{event.name}</span>
                  </div>
                  {event.creatorId === currentUserId && (
                    <EventActions event={event} compact={true} />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{event.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            {selectedDate 
              ? "No events scheduled for this date."
              : "Click on a date in the calendar to view events."}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default SelectedDateEvents;
