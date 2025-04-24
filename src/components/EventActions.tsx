
import { Event } from "@/types/eventTypes";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useEvents } from "@/contexts/EventContext";
import { Loader2 } from "lucide-react";

interface EventActionsProps {
  event: Event;
  compact?: boolean;
}

const EventActions = ({ event, compact = false }: EventActionsProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { deleteEvent } = useEvents();

  const handleEdit = () => {
    if (event.id) {
      navigate(`/event/edit/${event.id}`);
    }
  };

  const handleDelete = async () => {
    if (!event.id) return;
    
    setIsDeleting(true);
    try {
      await deleteEvent(event.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Failed to delete event:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (compact) {
    return (
      <>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0" 
            onClick={handleEdit}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0 text-red-500 hover:text-red-600" 
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        <DeleteConfirmationDialog 
          isOpen={showDeleteDialog}
          setIsOpen={setShowDeleteDialog}
          onDelete={handleDelete}
          eventName={event.name}
          isDeleting={isDeleting}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center" 
          onClick={handleEdit}
        >
          <Edit className="mr-1 h-4 w-4" />
          Edit
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center text-red-500 hover:text-red-600 border-red-200 hover:border-red-300 hover:bg-red-50" 
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="mr-1 h-4 w-4" />
          Delete
        </Button>
      </div>
    
      <DeleteConfirmationDialog 
        isOpen={showDeleteDialog}
        setIsOpen={setShowDeleteDialog}
        onDelete={handleDelete}
        eventName={event.name}
        isDeleting={isDeleting}
      />
    </>
  );
};

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onDelete: () => void;
  eventName: string;
  isDeleting: boolean;
}

const DeleteConfirmationDialog = ({
  isOpen,
  setIsOpen,
  onDelete,
  eventName,
  isDeleting
}: DeleteConfirmationDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Event</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{eventName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onDelete}
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
  );
};

export default EventActions;
