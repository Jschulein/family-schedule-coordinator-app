
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { EventNameInput } from './events/EventNameInput';
import { EventDateInput } from './events/EventDateInput';
import { EventTimeInput } from './events/EventTimeInput';
import { EventDescriptionInput } from './events/EventDescriptionInput';
import { EventFamilyMembersInput } from './events/EventFamilyMembersInput';
import { EventEndDateInput } from './events/EventEndDateInput';
import { EventAllDayToggle } from './events/EventAllDayToggle';
import { Loader2, Trash2 } from "lucide-react";
import { Event } from '@/types/eventTypes';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

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
  const [name, setName] = useState(event.name);
  const [date, setDate] = useState<Date>(event.date);
  const [endDate, setEndDate] = useState<Date | undefined>(event.end_date);
  const [time, setTime] = useState(event.time);
  const [description, setDescription] = useState(event.description || '');
  const [familyMembers, setFamilyMembers] = useState<string[]>(event.familyMembers || []);
  const [allDay, setAllDay] = useState(event.all_day || false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (name && date && event.id) {
      onSubmit({
        id: event.id,
        name,
        date,
        end_date: endDate || date,
        time,
        description,
        creatorId: event.creatorId,
        familyMembers,
        all_day: allDay,
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

  const isFormValid = name && name.length >= 3 && date;

  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Edit Event</CardTitle>
          <CardDescription>Update details for your event</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <EventNameInput 
              value={name} 
              onChange={setName} 
            />
            <EventDateInput 
              value={date} 
              onSelect={setDate} 
            />
            <EventEndDateInput 
              value={endDate} 
              onSelect={setEndDate}
              startDate={date}
            />
            <EventAllDayToggle
              value={allDay}
              onChange={setAllDay}
            />
            {!allDay && (
              <EventTimeInput
                value={time}
                onChange={setTime}
              />
            )}
            <EventDescriptionInput 
              value={description} 
              onChange={setDescription} 
            />
            <EventFamilyMembersInput 
              value={familyMembers} 
              onChange={setFamilyMembers} 
            />
            <div className="flex justify-between gap-4 pt-2">
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
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || isSubmitting || isDeleting}
                className="flex items-center"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Update Event'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{name}"? This action cannot be undone.
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
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditEventForm;
