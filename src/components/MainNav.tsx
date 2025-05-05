
import * as React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Calendar, Home, Users, Settings, Clipboard, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface MainNavProps extends React.HTMLAttributes<HTMLElement> {}

export function MainNav({ className, ...props }: MainNavProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Add navigation routes in this array
  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: <Home className="h-4 w-4 mr-2" />,
    },
    {
      name: "Calendar",
      href: "/calendar",
      icon: <Calendar className="h-4 w-4 mr-2" />,
    },
    {
      name: "Families",
      href: "/families",
      icon: <Users className="h-4 w-4 mr-2" />,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: <Settings className="h-4 w-4 mr-2" />,
    },
    {
      name: "Test Family Flow",
      href: "/test-family-flow",
      icon: <Clipboard className="h-4 w-4 mr-2" />,
    },
  ];

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      
      navigate("/auth");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error logging out",
        description: error.message || "There was a problem logging out.",
      });
    }
  };

  return (
    <nav
      className={cn("flex flex-col items-start space-y-4 p-4 h-full", className)}
      {...props}
    >
      <div className="flex-1 w-full">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) => 
              cn(
                "flex items-center text-sm font-medium transition-colors hover:text-primary w-full mb-4",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
            end
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </div>
      
      <button
        onClick={handleLogout}
        className="flex items-center text-sm font-medium transition-colors hover:text-primary w-full text-muted-foreground mt-auto"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </button>
    </nav>
  );
}
