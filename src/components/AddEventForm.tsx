
import { Event } from '@/types/eventTypes';
import { EventForm } from './events/EventForm';

interface AddEventFormProps {
  onSubmit: (event: Event) => void;
  isSubmitting?: boolean;
}

/**
 * Form component for adding new events
 * Now just a wrapper around the more generic EventForm component
 */
const AddEventForm = ({ onSubmit, isSubmitting = false }: AddEventFormProps) => {
  return (
    <EventForm
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      buttonText="Add Event"
      title="Add Family Event"
      description="Schedule a new event for your family calendar"
    />
  );
};

export default AddEventForm;
