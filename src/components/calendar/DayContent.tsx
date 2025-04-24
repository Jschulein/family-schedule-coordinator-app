
import { format } from "date-fns";
import { Event } from "@/types/eventTypes";

interface DayContentProps {
  date: Date;
  events: Event[];
  calendarColor: string;
}

const DayContent = ({ date, events, calendarColor }: DayContentProps) => {
  const dayEvents = events.filter(
    (event) => format(event.date, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
  );

  if (dayEvents.length === 0) {
    return <span>{date.getDate()}</span>;
  }

  const uniqueFamilyMembers = [...new Set(dayEvents.map(event => event.familyMember))];

  return (
    <div className="flex flex-col items-center">
      <span>{date.getDate()}</span>
      <div className="flex gap-1 justify-center mt-1">
        {uniqueFamilyMembers.map((member, index) => (
          <div
            key={index}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: calendarColor }}
          />
        ))}
      </div>
    </div>
  );
};

export default DayContent;
