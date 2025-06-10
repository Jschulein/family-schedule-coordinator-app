
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Plus } from 'lucide-react';

export const CreateFamily = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/families')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Family</h1>
          <p className="text-muted-foreground mt-2">
            Create a new family group and invite members
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Family Details
          </CardTitle>
          <CardDescription>
            Fill in the details for your new family group
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Family creation form will be implemented here.
          </p>
          
          <div className="mt-6 flex gap-2">
            <Button>
              <Users className="mr-2 h-4 w-4" />
              Create Family
            </Button>
            <Button variant="outline" onClick={() => navigate('/families')}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateFamily;
