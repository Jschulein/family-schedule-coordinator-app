
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Events = () => {
  const navigate = useNavigate();
  
  const handleCreateEvent = () => {
    navigate('/events/new');
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <Button onClick={handleCreateEvent}>
          <Plus className="mr-2 h-4 w-4" />
          New Event
        </Button>
      </div>
      
      <div className="text-center my-12">
        <p className="text-gray-500">
          Manage your events here. Click the button above to create a new event.
        </p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate('/calendar')}
        >
          View Calendar
        </Button>
      </div>
    </div>
  );
};

export default Events;
