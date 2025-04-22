
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AddEventForm from "@/components/AddEventForm";

const NewEvent = () => {
  const navigate = useNavigate();

  const handleSubmit = (event: {
    name: string;
    date: Date;
    description: string;
    familyMember: string;
  }) => {
    // For now we'll just show a success message and redirect
    // We'll implement actual data storage later
    toast.success("Event created successfully!");
    navigate("/calendar");
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

