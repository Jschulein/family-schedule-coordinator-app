
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { Event } from '@/types/eventTypes';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { EventForm } from './events/EventForm';

interface EditEventFormProps {
  event: Event;
  onSubmit: (event: Event) => void;
  onDelete: (eventId: string) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  isDeleting?: boolean;
}

const EditEventForm = ({
  event,
  onSubmit,
  onDelete,
  onCancel,
  isSubmitting = false,
  isDeleting = false,
}: EditEventFormProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleSubmit = (eventData: any) => {
    if (event.id) {
      onSubmit({
        ...eventData,
        id: event.id,
        creatorId: event.creatorId,
        familyMember: event.familyMember
      });
    }
  };

  const confirmDelete = () => {
    if (event.id) {
      onDelete(event.id);
    }
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <EventForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            buttonText="Update Event"
            title="Edit Event"
            description="Update details for your event"
            initialValues={event}
            extraButtons={
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting || isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isSubmitting || isDeleting}
                  className="flex items-center"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            }
          />
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{event.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="flex items-center"
            >
              {isDeleting && <span className="mr-2 h-4 w-4 animate-spin">●</span>}
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditEventForm;
