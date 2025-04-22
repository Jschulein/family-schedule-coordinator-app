
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Event } from "@/contexts/EventContext";

interface CalendarViewProps {
  events: Event[];
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
  calendarColor: string;
}

const CalendarView = ({ events, selectedDate, onSelectDate, calendarColor }: CalendarViewProps) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div className="w-full max-w-md">
          <Calendar
            mode="single"
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="pointer-events-auto w-full"
            selected={selectedDate}
            onSelect={onSelectDate}
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
  );
};

export default CalendarView;
