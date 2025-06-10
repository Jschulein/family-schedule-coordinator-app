
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Plus } from 'lucide-react';

export const CreateEvent = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/events')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Event</h1>
          <p className="text-muted-foreground mt-2">
            Add a new event to your family calendar
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Event Details
          </CardTitle>
          <CardDescription>
            Fill in the details for your new event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Event creation form will be implemented here.
          </p>
          
          <div className="mt-6 flex gap-2">
            <Button>
              <Calendar className="mr-2 h-4 w-4" />
              Create Event
            </Button>
            <Button variant="outline" onClick={() => navigate('/events')}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateEvent;
