
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isAfter, startOfDay } from "date-fns";
import { Event } from "@/types/eventTypes";

interface UpcomingFamilyEventsProps {
  events: Event[];
  calendarColor: string;
}

const UpcomingFamilyEvents = ({ events, calendarColor }: UpcomingFamilyEventsProps) => {
  const today = startOfDay(new Date());
  const upcomingEvents = events.filter(event => 
    isAfter(startOfDay(event.date), today) || 
    format(startOfDay(event.date), "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
  );

  const eventsByFamilyMember = upcomingEvents.reduce((groups: { [key: string]: Event[] }, event) => {
    const familyMember = event.familyMember || "Unknown";
    if (!groups[familyMember]) {
      groups[familyMember] = [];
    }
    groups[familyMember].push(event);
    return groups;
  }, {});

  return (
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
  );
};

export default UpcomingFamilyEvents;
