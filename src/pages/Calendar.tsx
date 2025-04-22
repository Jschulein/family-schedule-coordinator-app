
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Event {
  name: string;
  date: Date;
  description: string;
  familyMember: string;
}

const CalendarPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [calendarColor, setCalendarColor] = useState("#8B5CF6");
  const navigate = useNavigate();

  useEffect(() => {
    // TODO: Replace with actual event fetching logic
    const mockEvents: Event[] = [
      {
        name: "Family Dinner",
        date: new Date(2024, 3, 15),
        description: "Weekly family dinner",
        familyMember: "Mom"
      },
      {
        name: "Soccer Practice",
        date: new Date(2024, 3, 20),
        description: "Jimmy's soccer practice",
        familyMember: "Jimmy"
      }
    ];
    setEvents(mockEvents);

    const savedColor = localStorage.getItem('calendarColor');
    if (savedColor) {
      setCalendarColor(savedColor);
    }
  }, []);

  const modifiers = {
    event: (date: Date) =>
      events.some((event) => format(event.date, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")),
  };

  const modifiersStyles = {
    event: {
      backgroundColor: calendarColor,
      color: "white",
      borderRadius: "50%",
    },
  };

  const selectedDateEvents = selectedDate
    ? events.filter(
        (event) => format(event.date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
      )
    : [];

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
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                className="pointer-events-auto"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate 
                  ? `Events on ${format(selectedDate, 'PPP')}` 
                  : "Select a Date"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map((event, index) => (
                  <div key={index} className="border-b last:border-0 pb-3 mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" style={{ borderColor: calendarColor }}>
                        {event.familyMember}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(event.date, "PPP")}
                      </span>
                    </div>
                    <h3 className="font-medium">{event.name}</h3>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No events on this date</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
