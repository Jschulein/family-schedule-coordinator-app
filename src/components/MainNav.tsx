
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Home, Calendar, Users, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  {
    name: "Home",
    icon: Home,
    path: "/",
  },
  {
    name: "Calendar",
    icon: Calendar,
    path: "/calendar",
  },
  {
    name: "Families",
    icon: Users,
    path: "/families",
  },
  {
    name: "Settings",
    icon: Settings,
    path: "/settings",
  },
];

export function MainNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Sidebar className="bg-sidebar min-h-screen border-r border-sidebar-border">
      <SidebarHeader className="px-0 py-2 border-b border-sidebar-border flex flex-col items-center">
        <span className="text-lg font-bold tracking-tight text-sidebar-foreground">FS</span>
      </SidebarHeader>
      <SidebarContent className="flex flex-col items-center px-0 py-6">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ name, icon: Icon, path }) => (
                <SidebarMenuItem key={name} className="flex justify-center">
                  <SidebarMenuButton
                    size="lg"
                    variant={location.pathname === path ? "outline" : "default"}
                    isActive={location.pathname === path}
                    tooltip={name}
                    onClick={() => navigate(path)}
                    className="flex flex-col items-center justify-center w-12 h-12"
                  >
                    <Icon className="w-6 h-6 mx-auto" />
                    <span className="sr-only">{name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
