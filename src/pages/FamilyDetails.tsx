
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Calendar } from 'lucide-react';

export const FamilyDetails = () => {
  const { familyId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/families')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Family Details</h1>
          <p className="text-muted-foreground mt-2">
            Family ID: {familyId}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Family Members
            </CardTitle>
            <CardDescription>
              View and manage family members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Family member management will be implemented here.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Family Events
            </CardTitle>
            <CardDescription>
              Events associated with this family
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Family events will be displayed here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FamilyDetails;
