
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import EditEventForm from "@/components/EditEventForm";
import { useNavigate } from "react-router-dom";
import { useEditEventPage } from "@/hooks/events/useEditEventPage";

/**
 * Edit Event Page
 * Allows users to modify or delete existing events
 */
const EditEvent = () => {
  const navigate = useNavigate();
  const {
    event,
    isLoading,
    isSubmitting,
    isDeleting,
    error,
    contextError,
    handleSubmit,
    handleDelete,
    handleCancel
  } = useEditEventPage();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              className="mr-4" 
              onClick={() => navigate("/calendar")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return
            </Button>
            <h1 className="text-4xl font-bold text-gray-900">
              Edit Event
            </h1>
          </div>
        </div>
        
        {/* Error display section */}
        {contextError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Error: {contextError}. Please try refreshing the page or contact support.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Content section with loading, event form, or error message */}
        <div className="flex justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Loading event...</p>
            </div>
          ) : event ? (
            <EditEventForm 
              event={event}
              onSubmit={handleSubmit} 
              onDelete={handleDelete}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
              isDeleting={isDeleting}
            />
          ) : (
            <div className="text-center">
              <p className="mb-4">Event not found or you don't have permission to edit it.</p>
              <Button 
                variant="outline" 
                onClick={() => navigate("/calendar")}
              >
                Return to Calendar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditEvent;
