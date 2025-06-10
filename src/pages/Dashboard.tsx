
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Calendar, Settings, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to your family calendar dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendar
            </CardTitle>
            <CardDescription>
              View and manage your family events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/calendar')} className="w-full">
              View Calendar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Families
            </CardTitle>
            <CardDescription>
              Manage your family groups and members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/families')} className="w-full">
              Manage Families
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Create new events and families
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={() => navigate('/events/create')} 
              variant="outline" 
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Event
            </Button>
            <Button 
              onClick={() => navigate('/families/create')} 
              variant="outline" 
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Family
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
