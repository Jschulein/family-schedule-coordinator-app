
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Home, Calendar, Users } from "lucide-react"

export function MainNav() {
  return (
    <Sidebar>
      <SidebarHeader className="p-4 bg-sidebar-primary text-sidebar-primary-foreground">
        <h2 className="text-lg font-semibold">Family Schedule</h2>
      </SidebarHeader>
      <SidebarContent>
        <nav className="space-y-2 p-2">
          <a 
            href="/" 
            className="flex items-center space-x-2 p-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors group"
          >
            <Home className="h-5 w-5 group-hover:text-sidebar-accent-foreground" />
            <span>Home</span>
          </a>
          <a 
            href="/calendar" 
            className="flex items-center space-x-2 p-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors group"
          >
            <Calendar className="h-5 w-5 group-hover:text-sidebar-accent-foreground" />
            <span>Calendar</span>
          </a>
          <a 
            href="/families" 
            className="flex items-center space-x-2 p-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors group"
          >
            <Users className="h-5 w-5 group-hover:text-sidebar-accent-foreground" />
            <span>Families</span>
          </a>
        </nav>
      </SidebarContent>
    </Sidebar>
  )
}
