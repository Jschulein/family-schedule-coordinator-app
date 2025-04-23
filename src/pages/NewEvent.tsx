import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AddEventForm from "@/components/AddEventForm";
import { useEvents } from "@/contexts/EventContext";
import { supabase } from "@/integrations/supabase/client";

interface EventFormData {
  name: string;
  date: Date;
  time: string;
  description: string;
  creatorId: string;
  familyMembers: string[];
}

const NewEvent = () => {
  const navigate = useNavigate();
  const { addEvent } = useEvents();

  const handleSubmit = async (eventData: EventFormData) => {
    try {
      const event = {
        name: eventData.name,
        date: eventData.date,
        time: eventData.time,
        description: eventData.description,
        creatorId: eventData.creatorId,
        familyMembers: eventData.familyMembers
      };
      
      await addEvent(event);
      toast.success("Event created successfully!");
      navigate("/calendar");
    } catch (error) {
      toast.error("Failed to create event");
    }
  };

  const handleReturn = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-8">
          <Button 
            variant="outline" 
            className="mr-4" 
            onClick={handleReturn}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return
          </Button>
          <h1 className="text-4xl font-bold text-gray-900">
            Add New Event
          </h1>
        </div>
        <div className="flex justify-center">
          <AddEventForm onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
};

export default NewEvent;
