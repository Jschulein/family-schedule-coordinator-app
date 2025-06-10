
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Edit, Trash2 } from 'lucide-react';

export const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/events')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Event Details</h1>
          <p className="text-muted-foreground mt-2">
            Event ID: {eventId}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Event Information
          </CardTitle>
          <CardDescription>
            Details about this event
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Event details will be loaded and displayed here.
          </p>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate(`/events/${eventId}/edit`)}
              variant="outline"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Event
            </Button>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Event
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventDetails;
