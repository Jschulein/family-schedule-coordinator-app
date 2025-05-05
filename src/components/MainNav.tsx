
import * as React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Calendar, Home, Users, Settings, Clipboard } from "lucide-react";

interface MainNavProps extends React.HTMLAttributes<HTMLElement> {}

export function MainNav({ className, ...props }: MainNavProps) {
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

  return (
    <nav
      className={cn("flex flex-col items-start space-y-4 p-4", className)}
      {...props}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          className={({ isActive }) => 
            cn(
              "flex items-center text-sm font-medium transition-colors hover:text-primary w-full",
              isActive ? "text-primary" : "text-muted-foreground"
            )
          }
          end
        >
          {item.icon}
          {item.name}
        </NavLink>
      ))}
    </nav>
  );
}
