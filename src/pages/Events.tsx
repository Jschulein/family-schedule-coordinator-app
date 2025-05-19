
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Plus, Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import { useEvents } from "@/contexts/EventContext";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Event } from "@/types/eventTypes";
import EventActions from "@/components/EventActions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const Events = () => {
  const navigate = useNavigate();
  const { events, initialLoading, isRefreshing, error, refetchEvents } = useEvents();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [checkingProfile, setCheckingProfile] = useState<boolean>(true);
  
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
  
  // Check user session and profile
  useEffect(() => {
    const checkUserAndProfile = async () => {
      try {
        // Get current user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error fetching session:", sessionError);
          setCheckingProfile(false);
          return;
        }
        
        if (!session) {
          console.log("No active session found");
          setCheckingProfile(false);
          return;
        }
        
        setCurrentUserId(session.user.id);
        
        // Check for user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
          
        if (profileError) {
          console.error("Error fetching profile:", profileError);
        }
        
        setUserProfile(profile);
        setCheckingProfile(false);
        
        // If no profile was found, check if we need to create one
        if (!profile) {
          console.log("No profile found, you may need to create a new event to generate your profile");
        }
      } catch (e) {
        console.error("Failed to check user profile", e);
        setCheckingProfile(false);
      }
    };
    
    checkUserAndProfile();
  }, []);
  
  const handleCreateEvent = () => {
    navigate('/events/new');
  };
  
  const handleRefreshEvents = async () => {
    toast({
      title: "Refreshing events",
      description: "Fetching your latest event data..."
    });
    await refetchEvents(true);
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
  
  const renderProfileStatus = () => {
    if (checkingProfile) {
      return (
        <Alert className="mb-4 bg-blue-50">
          <AlertTitle>Checking your profile</AlertTitle>
          <AlertDescription>
            We're verifying your account setup to ensure you can see all your events.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (!currentUserId) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Not logged in</AlertTitle>
          <AlertDescription>
            You need to be logged in to view and create events.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (!userProfile) {
      return (
        <Alert className="mb-4 bg-amber-50 border-amber-200">
          <AlertTitle className="text-amber-800">Profile setup needed</AlertTitle>
          <AlertDescription className="text-amber-700">
            <p className="mb-2">Your user profile hasn't been created yet. Try creating a new event to complete your account setup.</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCreateEvent}
              className="mt-1 bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create new event
            </Button>
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={handleRefreshEvents}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh Events
          </Button>
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
      
      {renderProfileStatus()}
      
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
          <TabsTrigger value="debug">Troubleshooting</TabsTrigger>
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
        
        <TabsContent value="debug">
          <Card>
            <CardHeader>
              <CardTitle>Event Visibility Troubleshooting</CardTitle>
              <CardDescription>
                Use this information to help diagnose why events may not be displaying
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Authentication Status</h3>
                <pre className="bg-gray-100 p-3 text-xs rounded overflow-auto">
                  User ID: {currentUserId || 'Not logged in'}{'\n'}
                  Profile Found: {userProfile ? 'Yes' : 'No'}{'\n'}
                  Checking Profile: {checkingProfile ? 'In progress' : 'Complete'}
                </pre>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Events Data</h3>
                <pre className="bg-gray-100 p-3 text-xs rounded overflow-auto">
                  Total Events: {events.length}{'\n'}
                  Upcoming Events: {upcomingEvents.length}{'\n'}
                  Loading State: {initialLoading ? 'Loading' : 'Complete'}{'\n'}
                  Refresh State: {isRefreshing ? 'Refreshing' : 'Idle'}{'\n'}
                  Error: {error || 'None'}
                </pre>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Recommended Actions</h3>
                <p className="text-sm text-muted-foreground">If you don't see your events, try these solutions:</p>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={handleRefreshEvents}
                    size="sm"
                    className="w-full justify-start"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh events data
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleCreateEvent}
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create a new event (fixes profile issues)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Events;
