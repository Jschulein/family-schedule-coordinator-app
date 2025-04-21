
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Event {
  name: string;
  date: Date;
  description: string;
  familyMember: string;
}

interface EventCalendarProps {
  events: Event[];
}

const EventCalendar = ({ events }: EventCalendarProps) => {
  const modifiers = {
    event: (date: Date) =>
      events.some((event) => format(event.date, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")),
  };

  const modifiersStyles = {
    event: {
      backgroundColor: "#8B5CF6",
      color: "white",
      borderRadius: "50%",
    },
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Family Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          className="pointer-events-auto"
        />
        <div className="mt-4 space-y-2">
          <h3 className="font-semibold">Today's Events:</h3>
          {events
            .filter(
              (event) =>
                format(event.date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
            )
            .map((event, index) => (
              <div key={index} className="flex items-center gap-2">
                <Badge variant="outline">{event.familyMember}</Badge>
                <span>{event.name}</span>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCalendar;
