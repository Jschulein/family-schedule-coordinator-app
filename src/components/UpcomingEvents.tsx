
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Event {
  name: string;
  date: Date;
  description: string;
  familyMember: string;
}

const UpcomingEvents = ({ events }: { events: Event[] }) => {
  const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedEvents.map((event, index) => (
          <div key={index} className="border-b last:border-0 pb-3">
            <div className="flex items-center justify-between mb-1">
              <Badge variant="outline">{event.familyMember}</Badge>
              <span className="text-sm text-muted-foreground">
                {format(event.date, "PPP")}
              </span>
            </div>
            <h3 className="font-medium">{event.name}</h3>
            <p className="text-sm text-muted-foreground">{event.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default UpcomingEvents;
