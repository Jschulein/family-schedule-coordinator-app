
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Calendar, Users } from "lucide-react"
import { Link } from "react-router-dom"

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
          Family Schedule Coordinator
        </h1>
        
        <div className="flex flex-col space-y-6 max-w-md mx-auto">
          <Link to="/events/new">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  Add New Event
                </CardTitle>
                <CardDescription>
                  Please enter in your planned trips, events, and adventures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create and schedule new events for the family calendar.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/calendar">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  View Calendar
                </CardTitle>
                <CardDescription>
                  See all scheduled family events and activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Access the family calendar to view and manage all scheduled events.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Index
