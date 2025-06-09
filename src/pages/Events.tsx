
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Clock, MapPin, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Event {
  id: string;
  name: string;
  description: string | null;
  date: string;
  time: string;
  location?: string;
  all_day: boolean;
  creator_id: string;
}

export default function Events() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Try using the RPC function to get user accessible events
      const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('get_user_events_safe');
      
      if (rpcError) {
        console.warn("RPC function failed, falling back to direct query:", rpcError);
        
        // Fallback to querying events directly
        const { data: directData, error: directError } = await (supabase as any)
          .from('events')
          .select('*')
          .eq('creator_id', user?.id || '')
          .order('date', { ascending: true });

        if (directError) {
          throw directError;
        }

        setEvents(directData || []);
      } else {
        setEvents(rpcData || []);
      }
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to load events. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading events...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">Manage your family events</p>
        </div>
        <Button onClick={() => navigate('/events/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {events.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No events yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first family event.
            </p>
            <Button onClick={() => navigate('/events/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-1">{event.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {event.description || "No description provided"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(event.date)}
                  </div>
                  {!event.all_day && (
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2" />
                      {formatTime(event.time)}
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      {event.location}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
