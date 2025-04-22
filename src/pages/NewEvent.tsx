
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
          Add New Event
        </h1>
        <div className="flex justify-center">
          <AddEventForm onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
};

export default NewEvent;
