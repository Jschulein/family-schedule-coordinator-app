
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Event } from "@/types/eventTypes";
import { useNavigate } from "react-router-dom";
import EventActions from "./EventActions";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";

interface UpcomingEventsProps {
  events: Event[];
  limit?: number;
  showActions?: boolean;
  emptyMessage?: string;
  onCreateEvent?: () => void;
  title?: string;
}

const UpcomingEvents = ({ 
  events,
  limit = 5, 
  showActions = false,
  emptyMessage = "No upcoming events",
  onCreateEvent,
  title = "Upcoming Events" 
}: UpcomingEventsProps) => {
  const navigate = useNavigate();
  
  // Sort events by date (ascending)
  const sortedEvents = [...events]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit);
    
  const handleClick = (eventId?: string) => {
    if (eventId) {
      navigate(`/events/${eventId}`);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedEvents.length > 0 ? (
          sortedEvents.map((event, index) => (
            <div 
              key={event.id || index} 
              className="border-b last:border-0 pb-3 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded"
              onClick={() => handleClick(event.id)}
            >
              <div className="flex items-center justify-between mb-1">
                <Badge variant="outline">{event.familyMember}</Badge>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(event.date), "PPP")}
                  </span>
                  {showActions && event.id && <EventActions event={event} compact={true} />}
                </div>
              </div>
              <h3 className="font-medium">{event.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">{emptyMessage}</p>
            {onCreateEvent && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={onCreateEvent}
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Event
              </Button>
            )}
          </div>
        )}
        
        {sortedEvents.length > 0 && events.length > limit && (
          <div className="text-center pt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/events')}
            >
              View all {events.length} events
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingEvents;
