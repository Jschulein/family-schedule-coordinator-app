
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEvents } from '@/contexts/EventContext';
import CalendarView from '@/components/CalendarView';
import UpcomingFamilyEvents from '@/components/UpcomingFamilyEvents';
import SelectedDateEvents from '@/components/SelectedDateEvents';

const CalendarPage = () => {
  const { events } = useEvents();
  const [calendarColor, setCalendarColor] = useState("#8B5CF6");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-8">
          <Button 
            variant="outline" 
            className="mr-4" 
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return
          </Button>
          <h1 className="text-4xl font-bold text-gray-900">
            Family Calendar
          </h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <CalendarView 
            events={events}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            calendarColor={calendarColor}
          />
          <UpcomingFamilyEvents 
            events={events}
            calendarColor={calendarColor}
          />
          <SelectedDateEvents 
            selectedDate={selectedDate}
            events={events}
            calendarColor={calendarColor}
          />
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
