
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Home, Calendar } from "lucide-react"

export function MainNav() {
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <h2 className="text-lg font-semibold">Family Schedule</h2>
      </SidebarHeader>
      <SidebarContent>
        <nav className="space-y-2 p-2">
          <a href="/" className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md">
            <Home className="h-5 w-5" />
            <span>Home</span>
          </a>
          <a href="/calendar" className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md">
            <Calendar className="h-5 w-5" />
            <span>Calendar</span>
          </a>
        </nav>
      </SidebarContent>
    </Sidebar>
  )
}
