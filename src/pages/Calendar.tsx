
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
  const [calendarColor, setCalendarColor] = useState("#8B5CF6");
  const navigate = useNavigate();

  useEffect(() => {
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

  const getDayContent = (day: Date) => {
    const dayEvents = events.filter(
      (event) => format(event.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
    );

    if (dayEvents.length === 0) return null;

    const uniqueFamilyMembers = [...new Set(dayEvents.map(event => event.familyMember))];

    return (
      <div className="flex gap-1 justify-center mt-1">
        {uniqueFamilyMembers.map((member, index) => (
          <div
            key={index}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: calendarColor }}
          />
        ))}
      </div>
    );
  };

  const modifiers = {
    event: (date: Date) =>
      events.some((event) => format(event.date, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")),
  };

  const modifiersStyles = {
    event: {
      color: "black",
      backgroundColor: "transparent",
    },
  };

  const eventsByFamilyMember = events.reduce((groups: { [key: string]: Event[] }, event) => {
    if (!groups[event.familyMember]) {
      groups[event.familyMember] = [];
    }
    groups[event.familyMember].push(event);
    return groups;
  }, {});

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
            <CardContent className="flex justify-center">
              <div className="w-full max-w-md"> {/* Added container for centering and width control */}
                <Calendar
                  mode="single"
                  modifiers={modifiers}
                  modifiersStyles={modifiersStyles}
                  className="pointer-events-auto w-full"
                  components={{
                    DayContent: ({ date }) => (
                      <div className="flex flex-col items-center">
                        <span>{date.getDate()}</span>
                        {getDayContent(date)}
                      </div>
                    ),
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Family Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(eventsByFamilyMember).map(([familyMember, memberEvents]) => (
                  <div key={familyMember} className="space-y-3">
                    <h3 className="font-semibold text-lg">
                      <Badge variant="outline" style={{ borderColor: calendarColor }}>
                        {familyMember}
                      </Badge>
                    </h3>
                    {memberEvents.map((event, index) => (
                      <div key={index} className="border-b last:border-0 pb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{event.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {format(event.date, "PPP")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
