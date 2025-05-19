
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { useEvents } from "@/contexts/EventContext";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Event } from "@/types/eventTypes";
import EventActions from "@/components/EventActions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const Events = () => {
  const navigate = useNavigate();
  const { events, initialLoading, isRefreshing, error } = useEvents();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Get upcoming events (within the next 30 days)
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  const upcomingEvents = events
    .filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= today && eventDate <= thirtyDaysFromNow;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Get all events sorted by date
  const allEvents = [...events].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  useEffect(() => {
    // Get the current user ID from localStorage (this is a simplification)
    const userSession = localStorage.getItem('supabase.auth.token');
    if (userSession) {
      try {
        const session = JSON.parse(userSession);
        setCurrentUserId(session?.currentSession?.user?.id || null);
      } catch (e) {
        console.error("Failed to parse user session", e);
      }
    }
  }, []);
  
  const handleCreateEvent = () => {
    navigate('/events/new');
  };
  
  const renderEventRow = (event: Event) => (
    <TableRow key={event.id}>
      <TableCell>{format(new Date(event.date), "MMM d, yyyy")}</TableCell>
      <TableCell>
        <div className="font-medium">{event.name}</div>
        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
          {event.description}
        </div>
      </TableCell>
      <TableCell>
        {event.all_day ? (
          <Badge variant="outline">All day</Badge>
        ) : (
          <span>{event.time}</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant="outline">{event.familyMember}</Badge>
      </TableCell>
      <TableCell className="text-right">
        <EventActions event={event} compact={true} />
      </TableCell>
    </TableRow>
  );
  
  const renderLoadingState = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={() => navigate('/calendar')}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            View Calendar
          </Button>
          <Button onClick={handleCreateEvent}>
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Button>
        </div>
      </div>
      
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">
              Error loading events: {error}. Some events may not be displayed.
            </p>
          </CardContent>
        </Card>
      )}
      
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="all">All Events</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events (Next 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {initialLoading ? (
                renderLoadingState()
              ) : upcomingEvents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingEvents.map(renderEventRow)}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No upcoming events in the next 30 days.</p>
                  <Button 
                    variant="outline" 
                    onClick={handleCreateEvent}
                    className="mt-4"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first event
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Events</CardTitle>
            </CardHeader>
            <CardContent>
              {initialLoading ? (
                renderLoadingState()
              ) : allEvents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allEvents.map(renderEventRow)}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No events found.</p>
                  <Button 
                    variant="outline" 
                    onClick={handleCreateEvent}
                    className="mt-4"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first event
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Events;
