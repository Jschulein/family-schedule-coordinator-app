
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Event } from "@/contexts/EventContext";
import DayContent from "./calendar/DayContent";
import CalendarHeader from "./calendar/CalendarHeader";

interface CalendarViewProps {
  events: Event[];
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
  calendarColor: string;
}

const CalendarView = ({ events, selectedDate, onSelectDate, calendarColor }: CalendarViewProps) => {
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
      <CalendarHeader />
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
                <DayContent
                  date={date}
                  events={events}
                  calendarColor={calendarColor}
                />
              ),
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarView;
