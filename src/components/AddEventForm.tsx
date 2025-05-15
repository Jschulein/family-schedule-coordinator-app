
import { Card, CardContent } from "@/components/ui/card";
import { Event } from '@/types/eventTypes';
import { EventForm } from './events/EventForm';

interface AddEventFormProps {
  onSubmit: (event: Event) => void;
  isSubmitting?: boolean;
}

/**
 * Form component for adding new events
 * Wrapper around the more generic EventForm component
 */
const AddEventForm = ({ onSubmit, isSubmitting = false }: AddEventFormProps) => {
  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <EventForm
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          buttonText="Add Event"
          title="Add Family Event"
          description="Schedule a new event for your family calendar"
        />
      </CardContent>
    </Card>
  );
};

export default AddEventForm;
