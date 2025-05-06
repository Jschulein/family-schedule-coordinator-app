
import { cn } from "@/lib/utils";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
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

  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <Link
        to="/"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          isActive("/") ? "text-primary" : "text-muted-foreground"
        )}
      >
        Home
      </Link>
      <Link
        to="/calendar"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          isActive("/calendar") ? "text-primary" : "text-muted-foreground"
        )}
      >
        Calendar
      </Link>
      <Link
        to="/families"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          isActive("/families") ? "text-primary" : "text-muted-foreground"
        )}
      >
        Families
      </Link>
      <Link
        to="/events"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          isActive("/events") ? "text-primary" : "text-muted-foreground"
        )}
      >
        Events
      </Link>
      <Link
        to="/settings"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          isActive("/settings") ? "text-primary" : "text-muted-foreground"
        )}
      >
        Settings
      </Link>
      
      {user && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="ml-auto"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      )}
    </nav>
  );
}
