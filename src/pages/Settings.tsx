
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { HexColorPicker } from "react-colorful";

const Settings = () => {
  const [familyScheduleTitle, setFamilyScheduleTitle] = useState("Family Schedule Coordinator");
  const [calendarColor, setCalendarColor] = useState("#8B5CF6"); // Default to our vivid purple
  const navigate = useNavigate();

  const handleSave = () => {
    localStorage.setItem('familyScheduleTitle', familyScheduleTitle);
    localStorage.setItem('calendarColor', calendarColor);
    
    toast.success("Settings saved successfully!");
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
            App Settings
          </h1>
        </div>

        <div className="space-y-6 max-w-md mx-auto">
          <div>
            <Label>Family Schedule Title</Label>
            <Input 
              value={familyScheduleTitle}
              onChange={(e) => setFamilyScheduleTitle(e.target.value)}
              placeholder="Enter family schedule title"
            />
          </div>

          <div>
            <Label>Calendar Event Color</Label>
            <div className="mt-2">
              <HexColorPicker color={calendarColor} onChange={setCalendarColor} />
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
