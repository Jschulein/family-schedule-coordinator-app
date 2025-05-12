
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { 
  Home, 
  Calendar, 
  Users, 
  Settings,
  LogOut,
  Plus
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleCreateEvent = () => {
    navigate('/events/new');
  };

  return (
    <>
      <Sidebar variant="sidebar" collapsible="icon" className="border-r">
        <SidebarHeader className="flex items-center justify-center p-4 border-b">
          <h2 className="text-xl font-bold">FamilyCalendar</h2>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                tooltip="Home"
                isActive={isActive("/")}
                onClick={() => navigate("/")}
              >
                <Home />
                <span>Home</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                tooltip="Calendar"
                isActive={isActive("/calendar")}
                onClick={() => navigate("/calendar")}
              >
                <Calendar />
                <span>Calendar</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                tooltip="Families"
                isActive={isActive("/families")}
                onClick={() => navigate("/families")}
              >
                <Users />
                <span>Families</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                tooltip="Events"
                isActive={isActive("/events")}
                onClick={() => navigate("/events")}
              >
                <Calendar />
                <span>Events</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                tooltip="Settings"
                isActive={isActive("/settings")}
                onClick={() => navigate("/settings")}
              >
                <Settings />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        
        <SidebarFooter className="p-4 border-t">
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              onClick={handleCreateEvent}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Event
            </Button>
            
            {user && (
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="w-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            )}
          </div>
        </SidebarFooter>
      </Sidebar>
      
      <div className="md:hidden">
        <SidebarTrigger className="fixed bottom-4 right-4 z-50 rounded-full bg-primary text-primary-foreground shadow-lg" />
      </div>
    </>
  );
}
